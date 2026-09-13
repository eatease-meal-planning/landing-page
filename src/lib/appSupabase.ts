import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side client for the **app** Supabase project (`dagpiagorabmliuotkoc`),
 * which is a different project from the one this landing page uses for itself
 * (`src/lib/client.ts` / `src/lib/server.ts`, which are `@supabase/ssr`).
 *
 * **Server-side only, and that is the point.** The anon key is public by design
 * — the APK ships it, and the security boundary is the app project's RLS, not
 * the key's secrecy — but it is still a credential-shaped string, and putting
 * it in a `NEXT_PUBLIC_` variable both trips Vercel's secret scanner and puts
 * the app project into the browser bundle for no gain. Every call the deletion
 * flow makes goes through our own route handlers instead, so nothing about the
 * app project is served to anyone.
 *
 * `@supabase/supabase-js` and not `@supabase/ssr`: nothing here belongs in a
 * cookie. The flow asks for a one-time code, exchanges it for the user's own
 * JWT, and passes that token explicitly for the calls that follow.
 */

const AUTH_OPTIONS = {
  // No session may outlive the request that created it.
  persistSession: false,
  // The OTP session exists for one deletion; nothing should renew it.
  autoRefreshToken: false,
  // This is not an OAuth redirect target — never read the URL fragment.
  detectSessionInUrl: false,
} as const;

function present(raw: string | undefined): string | null {
  const value = (raw ?? "").trim();
  return value === "" ? null : value;
}

function appUrl(): string | null {
  return present(process.env.APP_SUPABASE_URL);
}

function appAnonKey(): string | null {
  return present(process.env.APP_SUPABASE_ANON_KEY);
}

/**
 * Whether the app project is configured, without building anything.
 *
 * A route's configuration check runs on every request and only needs to decide
 * whether to answer `CONFIG_MISSING_APP_SUPABASE`; the client belongs to the
 * code that actually calls Supabase.
 */
export function isAppSupabaseConfigured(): boolean {
  return appUrl() !== null && appAnonKey() !== null;
}

/**
 * A client for the app project, or null when it is not configured.
 *
 * Null rather than a throw, and read per call rather than at module scope, for
 * the reason `getResend()` documents: a misconfigured deployment must fail
 * *inside* the request, where the handler can answer with a stable code, not on
 * import — where it becomes a generic 500 with nothing to quote back to us.
 *
 * **A fresh instance per call, deliberately.** `signInWithOtp` and `verifyOtp`
 * leave session state on the instance that made the call; on Fluid compute one
 * process serves many requests, so a shared client would carry one requester's
 * state into the next request. Same rule as `src/lib/server.ts`.
 */
export function appSupabaseServer(): SupabaseClient | null {
  const url = appUrl();
  const key = appAnonKey();
  if (!url || !key) {
    console.error("[appSupabase] APP_SUPABASE_URL / APP_SUPABASE_ANON_KEY is not set");
    return null;
  }

  return createClient(url, key, { auth: AUTH_OPTIONS });
}

/**
 * Base URL of the app project's edge functions, or null when unconfigured.
 *
 * `delete-account` lives there, reads the subject from the JWT and never from
 * the body, and is reached only through `/api/account-deletion/confirm`.
 */
export function appFunctionsUrl(): string | null {
  const url = appUrl();
  if (!url) return null;
  return `${url.replace(/\/+$/, "")}/functions/v1`;
}

/**
 * Headers for a direct call to an edge function on behalf of a user.
 *
 * `apikey` identifies the project to the gateway; `Authorization` carries the
 * user's own token, which is what the function authorises against. Returns null
 * when the project is not configured, so a caller cannot build a half-formed
 * request out of it.
 */
export function appFunctionHeaders(accessToken: string): Record<string, string> | null {
  const key = appAnonKey();
  if (!key) return null;

  return {
    apikey:         key,
    Authorization:  `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}
