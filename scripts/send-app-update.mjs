/**
 * Email ÚNICO aos testers do teste fechado: há uma nova versão e, desta vez,
 * têm de a transferir à mão. A app já pede atualização por si daqui em diante,
 * por isso isto não é um mecanismo — é um envio, e depois apaga-se.
 *
 *   node scripts/send-app-update.mjs --link <url> --dry-run
 *   node scripts/send-app-update.mjs --link <url>
 *   node scripts/send-app-update.mjs --link <url> --email alguem@exemplo.com
 *
 * Opções:
 *   --link <url>   OBRIGATÓRIO. Para onde vai o botão. Sem fallback ao
 *                  CLOSED_TEST_DOWNLOAD_URL de propósito: o link certo deste envio
 *                  é decidido por quem envia, não herdado de um convite antigo.
 *   --dry-run      Mostra quem receberia, sem enviar nem registar nada.
 *   --email <addr> Só este contacto (tem de estar no teste).
 *   --force        Reenvia a quem já recebeu (segundo o ficheiro local).
 *   --from <addr>  Sobrepõe-se a CLOSED_TEST_FROM_EMAIL.
 *   --delay <ms>   Pausa entre envios (por defeito 400).
 *
 * Destinatários: contactos confirmados que já foram convidados para o teste
 * (`closed_test_invited_at IS NOT NULL`). Só há testers PT-PT, por isso o texto
 * vive aqui e não nos dicionários i18n.
 *
 * Retoma: cada envio limpo fica em `.app-update-sent.json` (ignorado pelo git).
 * Se o script morrer a meio, correr outra vez continua onde ficou. Não há coluna
 * na BD — para um envio único não justifica um schema.
 *
 * Ambiente: DATABASE_URL, RESEND_API_KEY, CLOSED_TEST_FROM_EMAIL, NEXT_PUBLIC_SITE_URL.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import { Resend } from "resend";
import { loadEnv, parseArgs, requireEnv } from "./_shared.mjs";
import { getFirstName, buildGreeting } from "../src/lib/closedTestInvite.ts";
import { renderEmail } from "../src/lib/email.ts";

loadEnv();

const args = parseArgs();

const COPY = {
  subject:      "Eatease - Já podes atualizar a app",
  greeting:     "Olá {name},",
  intro:        "Publicámos uma nova versão da Eatease. Desta vez a atualização não chega sozinha, por isso tens de transferir a versão mais recente à mão.",
  note:         "Depois disto, é a própria app que te avisa, quando a estiveres a usar, sempre que houver uma nova versão.",
  cta:          "Atualizar a Eatease",
  fallbackNote: "Se o botão não funcionar, copia e cola o seguinte link no teu navegador:",
  feedbackNote: "Se encontrares algum problema ou tiveres sugestões, basta responderes a este email.",
  signOff:      "Até breve,",
  team:         "A equipa Eatease",
  privacy:      "Política de Privacidade",
};

const SENT_FILE = resolve(process.cwd(), ".app-update-sent.json");

const dryRun = !!args["dry-run"];
const force = !!args.force;
const onlyEmail = args.email ? String(args.email).trim().toLowerCase() : null;
const delayMs = args.delay !== undefined ? Number(args.delay) : 400;

const updateUrl = args.link && args.link !== true ? String(args.link).trim() : "";
if (!/^https:\/\/\S+$/.test(updateUrl)) {
  console.error("Erro: --link <url https> é obrigatório (o destino do botão).");
  process.exit(1);
}

const databaseUrl = requireEnv("DATABASE_URL");
const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");
// Exigidas só no envio real — um dry-run tem de correr numa máquina sem chaves.
const fromEmail =
  (args.from ? String(args.from).trim() : "") ||
  (dryRun
    ? process.env.CLOSED_TEST_FROM_EMAIL?.trim() || "(dry-run)"
    : requireEnv("CLOSED_TEST_FROM_EMAIL", "uma caixa real — este email pede resposta"));
const apiKey = dryRun ? null : requireEnv("RESEND_API_KEY");

function loadSent() {
  if (!existsSync(SENT_FILE)) return new Set();
  return new Set(JSON.parse(readFileSync(SENT_FILE, "utf-8")));
}

function saveSent(sent) {
  writeFileSync(SENT_FILE, JSON.stringify([...sent].sort(), null, 2) + "\n");
}

function render(name) {
  return renderEmail(
    "app-update.html",
    {
      subject:       COPY.subject,
      greeting:      buildGreeting(COPY.greeting, getFirstName(name)),
      intro:         COPY.intro,
      note:          COPY.note,
      cta_label:     COPY.cta,
      update_url:    updateUrl,
      fallback_note: COPY.fallbackNote,
      feedback_note: COPY.feedbackNote,
      sign_off:      COPY.signOff,
      team:          COPY.team,
      privacy_policy: COPY.privacy,
      site_url:      siteUrl,
    },
    ["greeting"],
  );
}

const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  const rows = await sql`
    SELECT email, name
    FROM contacts
    WHERE confirmed = true
      AND closed_test_invited_at IS NOT NULL
      ${onlyEmail ? sql`AND LOWER(email) = ${onlyEmail}` : sql``}
    ORDER BY created_at ASC`;

  if (onlyEmail && rows.length === 0) {
    console.error(`Erro: ${onlyEmail} não é um contacto confirmado e convidado para o teste.`);
    process.exit(1);
  }

  const sent = loadSent();
  const pending = rows.filter((r) => force || !sent.has(r.email.toLowerCase()));

  console.log(`\nNo teste fechado:     ${rows.length}`);
  console.log(`Já receberam:         ${rows.length - pending.length}`);
  console.log(`A enviar agora:       ${pending.length}`);
  console.log(`Botão:                ${updateUrl}`);
  console.log(`Remetente:            ${fromEmail}`);
  console.log(dryRun ? "Modo:                 DRY RUN (não envia, não regista)\n" : "Modo:                 ENVIO REAL\n");

  if (pending.length === 0) {
    console.log("Nada a fazer.\n");
    return;
  }

  const resend = dryRun ? null : new Resend(apiKey);
  const failed = [];
  let ok = 0;

  for (let i = 0; i < pending.length; i++) {
    const { email, name } = pending[i];
    const counter = `[${i + 1}/${pending.length}]`;
    const html = render(name ?? "");

    if (dryRun) {
      console.log(`${counter} [DRY RUN] ${email} — "${COPY.subject}"`);
      continue;
    }

    // `send()` resolve { data, error } em vez de rejeitar: só regista depois de
    // um resultado limpo, senão uma falha ficava marcada como enviada.
    let result;
    try {
      result = await resend.emails.send({
        from: `Ricardo Rato · Eatease <${fromEmail}>`,
        to: email,
        subject: COPY.subject,
        html,
      });
    } catch (err) {
      result = { error: { message: err instanceof Error ? err.message : String(err) } };
    }

    if (result.error) {
      const message = result.error.message ?? JSON.stringify(result.error);
      console.log(`${counter} FALHOU ${email} — ${message} (fica por enviar)`);
      failed.push({ email, message });
    } else {
      sent.add(email.toLowerCase());
      saveSent(sent);
      ok++;
      console.log(`${counter} OK ${email} — id ${result.data?.id ?? "?"}`);
    }

    if (i < pending.length - 1 && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  console.log("\n=========================================");
  console.log(`Total:    ${pending.length}`);
  console.log(dryRun ? "Enviados: 0 (dry run — nada saiu, nada foi registado)" : `Enviados: ${ok}`);
  console.log(`Falhas:   ${failed.length}`);
  for (const f of failed) console.log(` - ${f.email}: ${f.message}`);
  console.log("=========================================\n");

  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("Erro fatal:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
