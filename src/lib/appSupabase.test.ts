import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The client for the *app* Supabase project (`dagpiagorabmliuotkoc`), which is
 * a different project from the one this landing page uses for itself.
 *
 * It is server-side only. The anon key is public by design — the APK ships it,
 * and the app project's RLS is the boundary, not the key's secrecy — but it
 * never reaches the browser from here: every call the deletion flow makes goes
 * through our own route handlers. These names carry no `NEXT_PUBLIC_` prefix,
 * and a test asserting that is the cheapest guard against someone adding one
 * back to "fix" a client component.
 */
const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

const URL_VAR = "APP_SUPABASE_URL";
const KEY_VAR = "APP_SUPABASE_ANON_KEY";

const APP_URL = "https://dagpiagorabmliuotkoc.supabase.co";
const APP_KEY = "anon-key-for-tests";

/** A distinct object per call, so identity assertions mean something. */
function freshClient() {
  return { instance: Symbol("supabase-client") };
}

async function loadModule() {
  vi.resetModules();
  return import("./appSupabase");
}

beforeEach(() => {
  vi.unstubAllEnvs();
  createClientMock.mockReset();
  createClientMock.mockImplementation(freshClient);
  vi.stubEnv(URL_VAR, APP_URL);
  vi.stubEnv(KEY_VAR, APP_KEY);
});

describe("appSupabaseServer", () => {
  it("builds the client against the app project's URL and anon key", async () => {
    const { appSupabaseServer } = await loadModule();

    appSupabaseServer();

    expect(createClientMock).toHaveBeenCalledWith(APP_URL, APP_KEY, expect.anything());
  });

  it("disables session persistence, so no session outlives the request", async () => {
    const { appSupabaseServer } = await loadModule();

    appSupabaseServer();

    const [, , options] = createClientMock.mock.calls[0];
    expect(options.auth.persistSession).toBe(false);
  });

  it("disables token auto-refresh, so an OTP session dies with the request", async () => {
    const { appSupabaseServer } = await loadModule();

    appSupabaseServer();

    const [, , options] = createClientMock.mock.calls[0];
    expect(options.auth.autoRefreshToken).toBe(false);
  });

  it("returns a fresh client per call, so one request's session cannot leak into the next", async () => {
    // `verifyOtp` leaves session state on the instance that made the call. On
    // Fluid compute the same process serves many requests — the rule
    // src/lib/server.ts already documents for the landing page's own client.
    const { appSupabaseServer } = await loadModule();

    expect(appSupabaseServer()).not.toBe(appSupabaseServer());
  });

  it("returns null instead of throwing when the URL is absent", async () => {
    // Same shape as getResend(): an unconfigured deployment must fail inside
    // the request, with a code the handler can report, not on import.
    vi.stubEnv(URL_VAR, "");
    const { appSupabaseServer } = await loadModule();

    expect(appSupabaseServer()).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns null instead of throwing when the anon key is absent", async () => {
    vi.stubEnv(KEY_VAR, "");
    const { appSupabaseServer } = await loadModule();

    expect(appSupabaseServer()).toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("returns null for a whitespace-only value, which is what an empty Vercel var looks like", async () => {
    vi.stubEnv(KEY_VAR, "   ");
    const { appSupabaseServer } = await loadModule();

    expect(appSupabaseServer()).toBeNull();
  });
});

describe("isAppSupabaseConfigured", () => {
  it("reports configured without building a client", async () => {
    const { isAppSupabaseConfigured } = await loadModule();

    expect(isAppSupabaseConfigured()).toBe(true);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("reports unconfigured when the URL is absent", async () => {
    vi.stubEnv(URL_VAR, "");
    const { isAppSupabaseConfigured } = await loadModule();

    expect(isAppSupabaseConfigured()).toBe(false);
  });

  it("reports unconfigured when the anon key is absent", async () => {
    vi.stubEnv(KEY_VAR, "");
    const { isAppSupabaseConfigured } = await loadModule();

    expect(isAppSupabaseConfigured()).toBe(false);
  });
});

describe("appFunctionsUrl", () => {
  it("points at the app project's edge functions, where delete-account lives", async () => {
    const { appFunctionsUrl } = await loadModule();

    expect(appFunctionsUrl()).toBe("https://dagpiagorabmliuotkoc.supabase.co/functions/v1");
  });

  it("does not double the slash when the configured URL has a trailing one", async () => {
    vi.stubEnv(URL_VAR, "https://dagpiagorabmliuotkoc.supabase.co/");
    const { appFunctionsUrl } = await loadModule();

    expect(appFunctionsUrl()).toBe("https://dagpiagorabmliuotkoc.supabase.co/functions/v1");
  });

  it("returns null when the URL is absent, rather than building https://undefined/...", async () => {
    vi.stubEnv(URL_VAR, "");
    const { appFunctionsUrl } = await loadModule();

    expect(appFunctionsUrl()).toBeNull();
  });
});

describe("appFunctionHeaders", () => {
  it("identifies the project with the key and the caller with their own token", async () => {
    const { appFunctionHeaders } = await loadModule();

    expect(appFunctionHeaders("user-jwt")).toMatchObject({
      apikey:        APP_KEY,
      Authorization: "Bearer user-jwt",
    });
  });

  it("returns null rather than a half-formed request when the key is absent", async () => {
    vi.stubEnv(KEY_VAR, "");
    const { appFunctionHeaders } = await loadModule();

    expect(appFunctionHeaders("user-jwt")).toBeNull();
  });
});

describe("the app project never reaches the browser", () => {
  it("reads no NEXT_PUBLIC_ variable", async () => {
    // A NEXT_PUBLIC_ name is inlined into the client bundle by static textual
    // match. This module is server-side precisely so that never happens.
    const source = await import("node:fs").then(({ readFileSync }) =>
      readFileSync(new URL("./appSupabase.ts", import.meta.url), "utf-8"),
    );

    // The read is what matters, not the prose: the file explains in a comment
    // why the prefix is avoided, and that sentence must not fail the test.
    expect(source).not.toContain("process.env.NEXT_PUBLIC_");
  });
});
