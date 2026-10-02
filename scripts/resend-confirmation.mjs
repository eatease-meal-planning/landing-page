/**
 * Reenvia o email de confirmação (duplo opt-in) a um contacto que já está na BD.
 *
 * Existe para o caso em que o formulário respondeu 201, a linha ficou em
 * `contacts` com `confirmed = false`, e o email nunca chegou à caixa da pessoa.
 * A rota POST /api/contacts não serve para isso: tem cooldown de 1 hora por
 * email, exige Turnstile, e um novo POST criaria sempre um token novo — matando
 * um link que talvez ainda esteja vivo na pasta de spam do destinatário.
 *
 *   node scripts/resend-confirmation.mjs --email alguem@exemplo.com --dry-run
 *   node scripts/resend-confirmation.mjs --email alguem@exemplo.com
 *
 * Opções:
 *   --email <addr>  Obrigatório. Tem de existir em `contacts`.
 *   --dry-run       Mostra o estado da linha e o link, sem enviar nem escrever.
 *   --rotate        Força um token novo mesmo que o atual ainda esteja válido.
 *   --from <addr>   Sobrepõe-se a RESEND_FROM_EMAIL.
 *   --site <url>    Sobrepõe-se a NEXT_PUBLIC_SITE_URL. Necessário em local:
 *                   o .env.local aponta para localhost, e um link para
 *                   localhost dentro do email do destinatário não abre nada.
 *
 * Ambiente: DATABASE_URL, RESEND_API_KEY, RESEND_FROM_EMAIL, NEXT_PUBLIC_SITE_URL.
 *
 * Corra da raiz do repositório: `renderEmail` resolve o template a partir de
 * process.cwd().
 *
 * O remetente é o RESEND_FROM_EMAIL da rota, e não o CLOSED_TEST_FROM_EMAIL dos
 * scripts de convite: este email tem de ser indistinguível do que a rota manda.
 *
 * O link de confirmação é sempre impresso, inclusive em dry-run. Quando o email
 * não chega — bounce, spam, suppression list da Resend — é esse URL que
 * desbloqueia a pessoa: entregue-o por outro canal e ela confirma sozinha, com
 * `source` a continuar a dizer a verdade ('form', token clicado).
 */
import postgres from "postgres";
import { Resend } from "resend";
import { loadEnv, parseArgs, requireEnv, resolveSiteUrl, loadLocaleEmails } from "./_shared.mjs";
import { renderEmail } from "../src/lib/email.ts";

loadEnv();

const args = parseArgs();

if (args.help || !args.email) {
  console.log(`
Uso:
  node scripts/resend-confirmation.mjs --email <addr> [--dry-run] [--rotate] [--from <addr>]
`);
  process.exit(args.help ? 0 : 1);
}

const dryRun = !!args["dry-run"];
const rotate = !!args.rotate;
const targetEmail = String(args.email).trim().toLowerCase();

const databaseUrl = requireEnv("DATABASE_URL");
// O link é o produto deste script. Apontado para localhost, é lixo na caixa de
// entrada de outra pessoa — e um envio é irreversível. Pára antes de sair.
// Antes de tocar na BD: uma recusa tardia já teria rodado o token e matado o
// link que ainda estava vivo.
const siteUrl = resolveSiteUrl({ args, dryRun });

// Exigidas só no envio real — um dry-run tem de correr sem chaves da Resend.
const fromEmail =
  (args.from ? String(args.from).trim() : "") ||
  (dryRun
    ? process.env.RESEND_FROM_EMAIL?.trim() || "(dry-run)"
    : requireEnv("RESEND_FROM_EMAIL", "o mesmo remetente que a rota POST /api/contacts usa"));
const apiKey = dryRun ? null : requireEnv("RESEND_API_KEY");

const sql = postgres(databaseUrl, { max: 1 });

const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

async function main() {
  const [row] = await sql`
    SELECT email, name, locale, source, confirmed, confirmed_at,
           token, token_expires_at, closed_test_invited_at, created_at
    FROM contacts
    WHERE LOWER(email) = ${targetEmail}
    LIMIT 1`;

  if (!row) {
    console.error(`Erro: ${targetEmail} não existe na tabela 'contacts'.`);
    console.error("Nada a reenviar — a pessoa terá de submeter o formulário.");
    process.exit(1);
  }

  const now = Date.now();
  const expiresAt = row.token_expires_at;
  const tokenLive = expiresAt instanceof Date && expiresAt.getTime() > now;
  // A rota deriva a última data de envio de token_expires_at menos o TTL. É a
  // única pista que a tabela guarda sobre quando o email saiu.
  const lastSentAt = expiresAt instanceof Date ? new Date(expiresAt.getTime() - TOKEN_TTL_MS) : null;

  console.log(`\nContacto:     ${row.email}`);
  console.log(`Nome:         ${row.name ?? "(sem nome)"}`);
  console.log(`Locale:       ${row.locale ?? "en"}`);
  console.log(`Origem:       ${row.source}`);
  console.log(`Inscrito a:   ${row.created_at?.toISOString() ?? "?"}`);
  console.log(`Confirmado:   ${row.confirmed ? `sim (${row.confirmed_at?.toISOString() ?? "?"})` : "não"}`);
  console.log(`Último envio: ${lastSentAt ? lastSentAt.toISOString() : "?"} (inferido)`);
  console.log(`Token expira: ${expiresAt?.toISOString() ?? "?"} — ${tokenLive ? "AINDA VÁLIDO" : "EXPIRADO"}`);
  console.log(`Convite teste:${row.closed_test_invited_at ? ` enviado a ${row.closed_test_invited_at.toISOString()}` : " ainda não"}`);

  if (row.confirmed) {
    console.error(
      `\n${row.email} já está confirmado. Não há nada para confirmar — ` +
        "se o que falta é o acesso ao teste fechado, use scripts/send-closed-test-invite.mjs.",
    );
    process.exit(1);
  }

  const needsNewToken = rotate || !tokenLive;
  console.log(
    needsNewToken
      ? `\nToken:        ${rotate ? "novo (--rotate)" : "novo (o anterior expirou)"}`
      : "\nToken:        reutilizado — o link que já enviámos continua a funcionar",
  );

  let token = row.token;
  if (needsNewToken && !dryRun) {
    const [updated] = await sql`
      UPDATE contacts
      SET token = gen_random_uuid(),
          token_expires_at = now() + interval '48 hours'
      WHERE LOWER(email) = ${targetEmail}
      RETURNING token, token_expires_at`;
    token = updated.token;
    console.log(`Novo prazo:   ${updated.token_expires_at.toISOString()}`);
  }

  const confirmUrl = `${siteUrl}/api/contacts/confirm?token=${token}`;
  console.log(`\nLink de confirmação:\n  ${confirmUrl}`);
  if (needsNewToken && dryRun) {
    console.log("  (dry-run: o token acima é o antigo e está expirado — um envio real gera outro)");
  }
  console.log("\nEste link funciona em qualquer canal. Se o email voltar a não chegar, entregue-o à pessoa.");

  const copy = await loadLocaleEmails(row.locale ?? "en");
  const emailT = copy.confirmation;
  const name = row.name ?? "";

  const html = renderEmail(
    "confirmation-email.html",
    {
      subject: emailT.subject,
      greeting: emailT.greeting.replace("{name}", name),
      intro: emailT.intro,
      cta_label: emailT.cta,
      confirm_url: confirmUrl,
      expires_note: emailT.expiresNote,
      sign_off: emailT.signOff,
      team: copy.teamName,
      site_url: siteUrl,
    },
    ["greeting"],
  );

  console.log(`\nRemetente:    Eatease <${fromEmail}>`);
  console.log(`Assunto:      ${emailT.subject}`);

  if (dryRun) {
    console.log("\nModo:         DRY RUN — nada saiu, nada foi escrito na BD.\n");
    return;
  }


  // O SDK não rejeita: resolve `{ data, error }`. Imprimimos a resposta inteira
  // porque é ela que distingue "a Resend aceitou" de "a Resend entregou" — um
  // bounce anterior ou a suppression list não aparecem aqui, só no painel.
  const { data, error } = await new Resend(apiKey).emails.send({
    from: `Eatease <${fromEmail}>`,
    to: row.email,
    subject: emailT.subject,
    html,
  });

  if (error) {
    console.error("\nA Resend recusou o email:", error);
    process.exitCode = 1;
    return;
  }

  console.log(`\nEnviado. id da Resend: ${data?.id ?? "(sem id)"}`);
  console.log("Confirme a entrega em https://resend.com/emails — 'sent' não é 'delivered'.\n");
}

main()
  .catch((err) => {
    console.error("Erro fatal:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
