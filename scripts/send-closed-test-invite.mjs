/**
 * Envia o link de opt-in do teste fechado (Google Play) aos contactos da BD.
 *
 * A tabela `contacts` é a única lista. Por defeito o script escolhe quem está
 * confirmado e ainda não foi convidado, e marca `closed_test_invited_at` a
 * cada envio limpo — correr duas vezes não envia duas vezes.
 *
 *   node scripts/send-closed-test-invite.mjs --dry-run
 *   node scripts/send-closed-test-invite.mjs
 *   node scripts/send-closed-test-invite.mjs --email alguem@exemplo.com
 *
 * Opções:
 *   --dry-run        Mostra quem receberia, sem enviar nem marcar nada.
 *   --email <addr>   Só este contacto (tem de existir na BD).
 *   --force          Inclui quem já foi convidado. Use com cuidado.
 *   --link <url>     Sobrepõe-se a CLOSED_TEST_OPT_IN_URL (passo 1, adesão).
 *   --download <url> Sobrepõe-se a CLOSED_TEST_DOWNLOAD_URL (passo 2, instalação).
 *   --from <addr>    Sobrepõe-se a CLOSED_TEST_FROM_EMAIL.
 *   --limit <n>      Envia no máximo n convites nesta passagem.
 *   --delay <ms>     Pausa entre envios (por defeito 400).
 *
 * Ambiente: DATABASE_URL, RESEND_API_KEY, RESEND_FROM_EMAIL,
 *           CLOSED_TEST_OPT_IN_URL, CLOSED_TEST_DOWNLOAD_URL, NEXT_PUBLIC_SITE_URL.
 *
 * O remetente NÃO é o RESEND_FROM_EMAIL das rotas: o convite pede explicitamente
 * que respondam ("basta responderes a este email"), e um no-reply torna esse
 * pedido falso. Vem de CLOSED_TEST_FROM_EMAIL, uma caixa que alguém lê.
 */
import postgres from "postgres";
import { Resend } from "resend";
import { loadEnv, parseArgs, requireEnv, loadLocaleEmails } from "./_shared.mjs";
import { sendInvites } from "../src/lib/closedTestInvite.ts";
import { renderEmail } from "../src/lib/email.ts";

loadEnv();

const args = parseArgs();

if (args.help) {
  console.log(`
Uso:
  node scripts/send-closed-test-invite.mjs [--dry-run] [--email <addr>] [--force]
                                           [--link <url>] [--limit <n>] [--delay <ms>]
`);
  process.exit(0);
}

const dryRun = !!args["dry-run"];
const force = !!args.force;
const onlyEmail = args.email ? String(args.email).trim().toLowerCase() : null;
const limit = args.limit ? Number(args.limit) : null;
const delayMs = args.delay !== undefined ? Number(args.delay) : 400;

const databaseUrl = requireEnv("DATABASE_URL");
const optInUrl =
  (args.link ? String(args.link).trim() : "") ||
  requireEnv("CLOSED_TEST_OPT_IN_URL", "Play Console > Como os testadores participam > Adesao na web");
const downloadUrl =
  (args.download ? String(args.download).trim() : "") ||
  requireEnv("CLOSED_TEST_DOWNLOAD_URL", "Play Console > Como os testadores participam > Adesao Android");
const siteUrl = requireEnv("NEXT_PUBLIC_SITE_URL");

// Exigidas só no envio real — um dry-run tem de correr numa máquina sem chaves.
const fromEmail =
  (args.from ? String(args.from).trim() : "") ||
  (dryRun
    ? process.env.CLOSED_TEST_FROM_EMAIL?.trim() || "(dry-run)"
    : requireEnv("CLOSED_TEST_FROM_EMAIL", "uma caixa real — este email pede resposta"));
const apiKey = dryRun ? null : requireEnv("RESEND_API_KEY");

const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  let rows;
  if (onlyEmail) {
    rows = await sql`
      SELECT email, name, locale, confirmed, closed_test_invited_at
      FROM contacts
      WHERE LOWER(email) = ${onlyEmail}
      LIMIT 1`;

    if (rows.length === 0) {
      console.error(`Erro: ${onlyEmail} não existe na tabela 'contacts'.`);
      console.error("Importe-o primeiro (scripts/import-closed-test-contacts.mjs) — a BD é a lista.");
      process.exit(1);
    }
    if (!rows[0].confirmed) {
      console.error(`Erro: ${onlyEmail} não está confirmado. Não enviamos convites a quem não confirmou.`);
      process.exit(1);
    }
    if (rows[0].closed_test_invited_at && !force) {
      console.error(
        `${onlyEmail} já foi convidado a ${rows[0].closed_test_invited_at.toISOString()}. Use --force para reenviar.`,
      );
      process.exit(1);
    }
  } else {
    rows = await sql`
      SELECT email, name, locale, confirmed, closed_test_invited_at
      FROM contacts
      WHERE confirmed = true
        ${force ? sql`` : sql`AND closed_test_invited_at IS NULL`}
      ORDER BY created_at ASC
      ${limit ? sql`LIMIT ${limit}` : sql``}`;
  }

  const recipients = rows.map((r) => ({
    email: r.email,
    name: r.name ?? "",
    locale: r.locale ?? "en",
  }));

  console.log(`\nContactos a convidar: ${recipients.length}`);
  console.log(`1 · Adesao (web):     ${optInUrl}`);
  console.log(`2 · Instalacao:       ${downloadUrl}`);
  console.log(`Remetente:            ${fromEmail}`);
  console.log(dryRun ? "Modo:                 DRY RUN (não envia, não marca)\n" : "Modo:                 ENVIO REAL\n");

  if (recipients.length === 0) {
    console.log("Nada a fazer — ninguém confirmado está por convidar.\n");
    return;
  }

  const resend = dryRun ? null : new Resend(apiKey);

  const summary = await sendInvites(recipients, {
    loadCopy: loadLocaleEmails,
    renderTemplate: renderEmail,
    sendEmail: ({ to, subject, html }) =>
      resend.emails.send({ from: `Ricardo Rato · Eatease <${fromEmail}>`, to, subject, html }),
    markInvited: async (email) => {
      await sql`UPDATE contacts SET closed_test_invited_at = now() WHERE LOWER(email) = ${email.toLowerCase()}`;
    },
    optInUrl,
    downloadUrl,
    siteUrl,
    dryRun,
    delayMs,
    onProgress: (line) => console.log(line),
  });

  console.log("\n=========================================");
  console.log(`Total:    ${summary.total}`);
  console.log(dryRun ? "Enviados: 0 (dry run — nada saiu, nada foi marcado)" : `Enviados: ${summary.sent}`);
  console.log(`Falhas:   ${summary.failed}`);
  if (summary.failed > 0) {
    console.log("\nPor convidar (continuam com closed_test_invited_at NULL — corra outra vez):");
    for (const o of summary.outcomes.filter((x) => x.status === "failed")) {
      console.log(` - ${o.email}: ${o.error}`);
    }
  }
  console.log("=========================================\n");

  if (summary.failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error("Erro fatal:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
