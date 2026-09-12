import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Clients for the *app* Supabase project (`dagpiagorabmliuotkoc`), which is a
 * different project from the one this landing page uses for itself.
 *
 * The factory is thin, so the configuration object it hands to `createClient`
 * IS the behaviour worth pinning — `persistSession: false` above all. The
 * spec's own verification for it ("DevTools → Local Storage sem chaves
 * `sb-dagpia*`") cannot run until TASK-13 renders a browser client, so until
 * then these assertions are the only thing guarding the property.
 */
const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({ createClient: createClientMock }));

const URL_VAR = "NEXT_PUBLIC_APP_SUPABASE_URL";
const KEY_VAR = "NEXT_PUBLIC_APP_SUPABASE_ANON_KEY";

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

  it("disables session persistence, so no sb-dagpia* key is ever written to storage", async () => {
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
    // `signInWithOtp` leaves session state on the instance that made the call.
    // On Fluid compute the same process serves many requests — the rule
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

describe("appSupabaseBrowser", () => {
  it("reuses one client across calls rather than rebuilding it per interaction", async () => {
    // The three-step form (TASK-13) calls verifyOtp and then reads the token it
    // returned; a client rebuilt between renders throws that state away.
    const { appSupabaseBrowser } = await loadModule();

    expect(appSupabaseBrowser()).toBe(appSupabaseBrowser());
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });

  it("disables session persistence, so the app project leaves no session on eatease.eu", async () => {
    const { appSupabaseBrowser } = await loadModule();

    appSupabaseBrowser();

    const [, , options] = createClientMock.mock.calls[0];
    expect(options.auth.persistSession).toBe(false);
  });

  it("returns null instead of throwing when configuration is absent", async () => {
    vi.stubEnv(URL_VAR, "");
    const { appSupabaseBrowser } = await loadModule();

    expect(appSupabaseBrowser()).toBeNull();
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
