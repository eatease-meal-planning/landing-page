/**
 * Bits both closed-test scripts need. Kept here so the two cannot drift —
 * the previous pair disagreed about the sender address, among other things.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { locales, isValidLocale } from "../src/lib/i18n/config.ts";

/** Loads .env.local / .env without adding a dependency. Never overrides a real env var. */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const fullPath = resolve(process.cwd(), file);
    if (!existsSync(fullPath)) continue;

    for (const line of readFileSync(fullPath, "utf-8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (/^(".*"|'.*')$/s.test(val)) val = val.slice(1, -1);

      if (process.env[key] === undefined) process.env[key] = val;
    }
  }
}

export function parseArgs(argv = process.argv.slice(2)) {
  const params = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      params[key] = argv[++i];
    } else {
      params[key] = true;
    }
  }
  return params;
}

/** Exits with a message instead of letting a missing variable surface as a Resend 401. */
export function requireEnv(name, hint) {
  const value = (process.env[name] ?? "").trim();
  if (!value) {
    console.error(`Erro: ${name} não está definida${hint ? ` (${hint})` : ""}.`);
    process.exit(1);
  }
  return value;
}

const cache = new Map();

/**
 * Loads one locale's email copy.
 *
 * The fallback is announced. The version this replaces swallowed it, so a
 * German tester could be mailed in Portuguese with nothing in the log to say
 * so — the opposite of how the rest of this codebase treats a failure.
 */
export async function loadLocaleEmails(locale) {
  const key = isValidLocale(locale) ? locale : null;
  if (!key) {
    console.warn(`  [i18n] Locale "${locale}" não é suportado (${locales.join(", ")}). A usar "en".`);
  }
  const target = key ?? "en";

  if (cache.has(target)) return cache.get(target);

  const mod = await import(`../src/lib/i18n/locales/${target}/emails.ts`);
  cache.set(target, mod.emails);
  return mod.emails;
}
