import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Clients for the **app** Supabase project (`dagpiagorabmliuotkoc`) — a
 * different project from the one this landing page uses for itself
 * (`src/lib/client.ts` / `src/lib/server.ts`, which are `@supabase/ssr`).
 *
 * Why `@supabase/supabase-js` and not `@supabase/ssr`: nothing here belongs in
 * a cookie. The account-deletion flow asks the app project for a one-time code,
 * exchanges it for the user's own JWT, and passes that token explicitly for the
 * two calls that follow. A cookie-backed session would outlive the flow and
 * leave an app-project session on `eatease.eu`.
 *
 * The anon key is public by design — the APK already ships it, so naming it
 * `NEXT_PUBLIC_` adds no attack surface.
 */

const AUTH_OPTIONS = {
  // The property that keeps `sb-dagpia*` out of localStorage.
  persistSession: false,
  // The OTP session exists for one deletion; nothing should renew it.
  autoRefreshToken: false,
  // This is not an OAuth redirect target — never read the URL fragment.
  detectSessionInUrl: false,
} as const;

/**
 * `NEXT_PUBLIC_*` values are inlined at build time by static textual match, so
 * each one has to be written out literally. Reading them through a computed
 * `process.env[name]` would work on the server and be `undefined` in the
 * browser bundle.
 */
function present(raw: string | undefined): string | null {
  const value = (raw ?? "").trim();
  return value === "" ? null : value;
}

function appUrl(): string | null {
  return present(process.env.NEXT_PUBLIC_APP_SUPABASE_URL);
}

function appAnonKey(): string | null {
  return present(process.env.NEXT_PUBLIC_APP_SUPABASE_ANON_KEY);
}

/**
 * A client for the app project, or null when it is not configured.
 *
 * Null rather than a throw, and read per call rather than at module scope, for
 * the reason `getResend()` documents: a misconfigured deployment must fail
 * *inside* the request, where the handler can answer with a stable code, not on
 * import — where it becomes a generic 500 with nothing to quote back to us. On
 * a page with legal weight a silent failure is worse than a loud one.
 *
 * **A fresh instance per call, deliberately.** `signInWithOtp` leaves session
 * state on the instance that made the call; on Fluid compute one process serves
 * many requests, so a shared server client would carry one requester's state
 * into the next request. Same rule as `src/lib/server.ts`.
 */
export function appSupabaseServer(): SupabaseClient | null {
  const url = appUrl();
  const key = appAnonKey();
  if (!url || !key) {
    console.error("[appSupabase] NEXT_PUBLIC_APP_SUPABASE_URL / _ANON_KEY is not set");
    return null;
  }

  return createClient(url, key, { auth: AUTH_OPTIONS });
}

let browserClient: SupabaseClient | null = null;
let browserBuiltFor: string | null = null;

/**
 * The browser client for the app project, or null when it is not configured.
 *
 * Cached, unlike the server one: the three-step deletion form calls `verifyOtp`
 * and then uses what it returned, and a client rebuilt between renders would
 * throw that away. There is one visitor per browser, so there is nothing here
 * for a shared instance to leak.
 */
export function appSupabaseBrowser(): SupabaseClient | null {
  const url = appUrl();
  const key = appAnonKey();
  if (!url || !key) {
    console.error("[appSupabase] NEXT_PUBLIC_APP_SUPABASE_URL / _ANON_KEY is not set");
    return null;
  }

  const fingerprint = `${url}|${key}`;
  if (!browserClient || browserBuiltFor !== fingerprint) {
    browserClient = createClient(url, key, { auth: AUTH_OPTIONS });
    browserBuiltFor = fingerprint;
  }
  return browserClient;
}

/**
 * Base URL of the app project's edge functions, or null when unconfigured.
 *
 * `delete-account` lives there and is called directly from the browser with the
 * user's own JWT — it answers `Access-Control-Allow-Origin: *` and reads the
 * subject from the token, never from the body.
 */
export function appFunctionsUrl(): string | null {
  const url = appUrl();
  if (!url) return null;
  return `${url.replace(/\/+$/, "")}/functions/v1`;
}
