/**
 * Importa o closed_test_contacts.csv para a tabela `contacts`, uma vez.
 *
 * Porquê: essas pessoas deram o email por outra via e pediram para entrar no
 * teste. Enquanto viverem só no CSV, são dados pessoais (nome + email) fora do
 * alcance do /delete-account — a mesma razão que obriga `contacts` a ter um
 * caminho de eliminação obriga-as a estar lá dentro.
 *
 * Ficam com source='manual' e confirmed=true: o consentimento existe, mas
 * ninguém clicou num token, e `source` é o que impede a flag de mentir sem
 * rasto. Quem já existir na tabela é deixado como está — o consentimento dado
 * pelo formulário é o mais forte dos dois e não se sobrepõe.
 *
 *   node scripts/import-closed-test-contacts.mjs --dry-run
 *   node scripts/import-closed-test-contacts.mjs
 *
 * Opções:
 *   --dry-run       Mostra o que seria inserido, sem escrever.
 *   --csv <path>    Caminho do ficheiro (por defeito closed_test_contacts.csv).
 *   --locale <l>    Locale dos importados (por defeito pt-pt).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import { loadEnv, parseArgs, requireEnv } from "./_shared.mjs";
import { parseContactsCsv } from "../src/lib/closedTestInvite.ts";
import { isValidLocale } from "../src/lib/i18n/config.ts";

loadEnv();

const args = parseArgs();

if (args.help) {
  console.log(`
Uso:
  node scripts/import-closed-test-contacts.mjs [--dry-run] [--csv <path>] [--locale <l>]
`);
  process.exit(0);
}

const dryRun = !!args["dry-run"];
const csvPath = resolve(process.cwd(), args.csv ? String(args.csv) : "closed_test_contacts.csv");
const locale = args.locale ? String(args.locale).toLowerCase() : "pt-pt";

if (!isValidLocale(locale)) {
  console.error(`Erro: locale "${locale}" não é suportado.`);
  process.exit(1);
}

if (!existsSync(csvPath)) {
  console.error(`Erro: ficheiro não encontrado em '${csvPath}'.`);
  process.exit(1);
}

const databaseUrl = requireEnv("DATABASE_URL");
const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  const rows = parseContactsCsv(readFileSync(csvPath, "utf-8"));
  console.log(`\nCSV: ${csvPath}`);
  console.log(`Linhas válidas: ${rows.length} · locale: ${locale}`);
  console.log(dryRun ? "Modo: DRY RUN (não escreve)\n" : "Modo: ESCRITA REAL\n");

  if (rows.length === 0) {
    console.log("Nada a importar.\n");
    return;
  }

  const existing = new Set(
    (await sql`SELECT LOWER(email) AS email FROM contacts WHERE LOWER(email) IN ${sql(rows.map((r) => r.email))}`)
      .map((r) => r.email),
  );

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    if (existing.has(row.email)) {
      console.log(`  já existe  ${row.email} — deixado como está`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  inseriria  ${row.email} · "${row.name}"`);
      inserted++;
      continue;
    }

    // ON CONFLICT protege contra uma inscrição pelo formulário entre a leitura
    // acima e este INSERT.
    const result = await sql`
      INSERT INTO contacts (name, email, locale, source, confirmed, confirmed_at)
      VALUES (${row.name}, ${row.email}, ${locale}, 'manual', true, now())
      ON CONFLICT (email) DO NOTHING
      RETURNING email`;

    if (result.length === 0) {
      console.log(`  já existe  ${row.email} — deixado como está`);
      skipped++;
    } else {
      console.log(`  inserido   ${row.email} · "${row.name}"`);
      inserted++;
    }
  }

  console.log("\n=========================================");
  console.log(`Inseridos: ${inserted}`);
  console.log(`Ignorados: ${skipped}`);
  console.log("=========================================\n");

  if (!dryRun && inserted > 0) {
    console.log("O CSV pode ser apagado — a BD passa a ser a lista.\n");
  }
}

main()
  .catch((err) => {
    console.error("Erro fatal:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
