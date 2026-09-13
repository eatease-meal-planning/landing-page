/**
 * Sends one real deletion code, so the Magic Link template can be read in an
 * inbox before any copy promises the flow exists.
 *
 * It answers the one question the test suite cannot: does
 * `signInWithOtp({ shouldCreateUser: false })` deliver `emailRedirectTo` to the
 * template as `{{ .RedirectTo }}`? If it does, the ten `{{ if eq }}` branches in
 * `src/templates/deletion-code.html` pick a language. If it arrives empty,
 * Supabase fell back to the Site URL, no branch matches, and every language
 * renders in English — silently, which is why this has to be seen rather than
 * assumed.
 *
 * It deliberately does NOT go through /api/account-deletion/request: that route
 * requires a Turnstile token a terminal cannot produce. It calls the app project
 * exactly as the route does, with the same public anon key.
 *
 *   node scripts/probe-otp-email.mjs --email you@example.com
 *   node scripts/probe-otp-email.mjs --email you@example.com --locale pt-pt
 *
 * The address must already have an account in the app: `shouldCreateUser: false`
 * means an unknown address gets nothing, which is the anti-enumeration property
 * working as designed, not a failure of the probe.
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv, parseArgs, requireEnv } from "./_shared.mjs";
import { isValidLocale } from "../src/lib/i18n/config.ts";
import { deletionPageUrl } from "../src/lib/deletionPageUrl.ts";

loadEnv();

const args = parseArgs();
const email = typeof args.email === "string" ? args.email.trim() : "";
const locale = typeof args.locale === "string" ? args.locale.trim() : "en";

if (!email) {
  console.error("Erro: falta --email <endereço com conta na app>.");
  process.exit(1);
}
if (!isValidLocale(locale)) {
  console.error(`Erro: --locale ${locale} não é servida. Usa uma de: de en es fr it nl pl pt-pt ro sv`);
  process.exit(1);
}

// As duas vivem no `.env.local` DESTA árvore. O valor é que vem do projeto da
// app — o `loadEnv()` lê a partir do cwd, e o `.env` do repo `app` não é lido
// por ninguém aqui.
const url = requireEnv(
  "NEXT_PUBLIC_APP_SUPABASE_URL",
  "põe-na no .env.local da landing-page; o valor é o URL do projeto da app",
);
const key = requireEnv(
  "NEXT_PUBLIC_APP_SUPABASE_ANON_KEY",
  "põe-na no .env.local da landing-page; o valor é a EXPO_PUBLIC_SUPABASE_ANON_KEY do repo app",
);

const emailRedirectTo = deletionPageUrl(locale);

console.log(`Projeto:   ${url}`);
console.log(`Para:      ${email}`);
console.log(`RedirectTo: ${emailRedirectTo}`);
console.log("");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { shouldCreateUser: false, emailRedirectTo },
});

if (error) {
  console.error(`Supabase recusou: ${error.message}`);
  console.error("");
  console.error("Causas por ordem de probabilidade:");
  console.error("  - o endereço não tem conta na app (shouldCreateUser: false)");
  console.error("  - o emailRedirectTo não está na allow-list de Redirect URLs");
  console.error("  - limite de envio de emails atingido");
  process.exit(1);
}

console.log("Pedido aceite. No email recebido, confirma:");
console.log("  1. que o RT=[...] traz o URL acima — é o que escolhe a língua");
console.log("  2. que o código de 6 dígitos aparece");
console.log("  3. o remetente, que deve ser o SMTP configurado e não o do Supabase");
