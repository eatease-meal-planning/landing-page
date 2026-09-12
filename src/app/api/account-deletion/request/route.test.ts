import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { deletionPageUrl } from "@/lib/deletionPageUrl";

/**
 * Step 1 of the self-service deletion: ask the app's Supabase project for a
 * six-digit code.
 *
 * The property this route exists to hold is that it says the same thing whether
 * or not an account exists — in bytes and in time. `shouldCreateUser: false`
 * makes Supabase answer with an error for an unknown address, and an existing
 * address takes visibly longer to mail, so either leaking through would turn
 * this endpoint into an account-enumeration oracle for a nutrition app.
 */
const { otpMock, afterMock } = vi.hoisted(() => ({ otpMock: vi.fn(), afterMock: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { signInWithOtp: otpMock } }),
}));

// `after()` needs a request scope that a direct handler call does not provide.
// The spy stands in for it, and the tests run the deferred work by hand — which
// is also the only way to assert that the response does not wait for it.
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: afterMock,
}));

vi.mock("@/lib/rateLimit", () => ({ checkRateLimit: vi.fn().mockResolvedValue(false) }));

vi.mock("@/lib/turnstile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/turnstile")>()),
  verifyTurnstile: vi.fn().mockResolvedValue({ ok: true, codes: [] }),
}));

const { checkRateLimit } = await import("@/lib/rateLimit");
const { verifyTurnstile } = await import("@/lib/turnstile");

const APP_URL = "https://dagpiagorabmliuotkoc.supabase.co";
const APP_KEY = "anon-key-for-tests";

/** Re-imports the route so module-scope configuration is re-evaluated. */
async function loadRoute() {
  vi.resetModules();
  return (await import("./route")).POST;
}

function deletionRequest(body: Record<string, unknown> = {}) {
  return new NextRequest("https://test.invalid/api/account-deletion/request", {
    method:  "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body:    JSON.stringify({
      email:            "someone@example.com",
      locale:           "en",
      cfTurnstileToken: "dummy-token",
      ...body,
    }),
  });
}

/** Runs whatever the route deferred with `after()`. */
async function runDeferredWork() {
  for (const [work] of afterMock.mock.calls) await work();
}

/** What the SDK resolves for an address with no account. */
const NO_SUCH_USER = {
  data:  { user: null, session: null },
  error: { name: "AuthApiError", status: 400, message: "Signups not allowed for otp" },
};

const OTP_SENT = { data: { user: null, session: null }, error: null };

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_APP_SUPABASE_URL", APP_URL);
  vi.stubEnv("NEXT_PUBLIC_APP_SUPABASE_ANON_KEY", APP_KEY);
  otpMock.mockReset().mockResolvedValue(OTP_SENT);
  afterMock.mockReset();
  vi.mocked(checkRateLimit).mockReset().mockResolvedValue(false);
  vi.mocked(verifyTurnstile).mockReset().mockResolvedValue({ ok: true, codes: [] });
});

describe("POST /api/account-deletion/request — the answer never reveals whether the account exists", () => {
  it("answers byte-for-byte the same for an address with and without an account", async () => {
    const POST = await loadRoute();

    otpMock.mockResolvedValue(OTP_SENT);
    const existing = await POST(deletionRequest({ email: "has-account@example.com" }));
    const existingBody = await existing.text();
    await runDeferredWork();

    afterMock.mockReset();
    otpMock.mockResolvedValue(NO_SUCH_USER);
    const unknown = await POST(deletionRequest({ email: "no-account@example.com" }));
    const unknownBody = await unknown.text();
    await runDeferredWork();

    // Not toEqual on parsed JSON: that would pass even if one path added a
    // field, and a difference in the body is the whole oracle.
    expect(unknownBody).toBe(existingBody);
    expect(unknown.status).toBe(existing.status);
    expect(unknown.headers.get("content-type")).toBe(existing.headers.get("content-type"));
  });

  it("answers 200 { ok: true }", async () => {
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("does not wait for Supabase before answering, so the reply time says nothing", async () => {
    // Sending to a real mailbox takes visibly longer than rejecting an unknown
    // address. Awaiting it here would publish that difference as latency.
    const POST = await loadRoute();
    otpMock.mockImplementation(() => new Promise(() => {}));

    const res = await POST(deletionRequest());

    expect(res.status).toBe(200);
    expect(otpMock).not.toHaveBeenCalled();
    expect(afterMock).toHaveBeenCalledOnce();
  });

  it("still answers ok when Supabase rejects the request outright", async () => {
    const POST = await loadRoute();
    otpMock.mockRejectedValue(new Error("network down"));

    const res = await POST(deletionRequest());
    await expect(runDeferredWork()).resolves.not.toThrow();

    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});

describe("POST /api/account-deletion/request — what it asks Supabase for", () => {
  it("never creates an account for an address that does not have one", async () => {
    // Without this the endpoint would sign people up to the app project as a
    // side effect of asking to be deleted.
    const POST = await loadRoute();

    await POST(deletionRequest());
    await runDeferredWork();

    expect(otpMock).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ shouldCreateUser: false }) }),
    );
  });

  it("sends the visitor's own locale as the URL the email template branches on", async () => {
    const POST = await loadRoute();

    await POST(deletionRequest({ locale: "pt-pt" }));
    await runDeferredWork();

    expect(otpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email:   "someone@example.com",
        options: expect.objectContaining({ emailRedirectTo: deletionPageUrl("pt-pt") }),
      }),
    );
  });

  it("falls back to English for a locale this site does not serve", async () => {
    const POST = await loadRoute();

    await POST(deletionRequest({ locale: "klingon" }));
    await runDeferredWork();

    expect(otpMock).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ emailRedirectTo: deletionPageUrl("en") }) }),
    );
  });

  it("sends the canonical production URL even from a localhost deployment", async () => {
    // The URL is never followed — the email carries a code and no link at all.
    // It travels only so the Supabase template can read {{ .RedirectTo }} and
    // pick a language, which is why dev must produce the production string.
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const POST = await loadRoute();

    await POST(deletionRequest({ locale: "de" }));
    await runDeferredWork();

    expect(otpMock).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ emailRedirectTo: "https://www.eatease.eu/de/delete-account" }),
      }),
    );
  });
});

describe("POST /api/account-deletion/request — failures carry a code the page shows", () => {
  it("answers CONFIG_MISSING_APP_SUPABASE when the app project is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_SUPABASE_ANON_KEY", "");
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "CONFIG_MISSING_APP_SUPABASE" });
    expect(afterMock).not.toHaveBeenCalled();
  });

  it("takes its rate-limit budget from the del: prefix, not the signup form's", async () => {
    const POST = await loadRoute();

    await POST(deletionRequest());

    expect(checkRateLimit).toHaveBeenCalledWith("del:203.0.113.7");
  });

  it("answers RATE_LIMITED without asking Supabase for anything", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue(true);
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toMatchObject({ code: "RATE_LIMITED" });
    expect(afterMock).not.toHaveBeenCalled();
  });

  it("answers INVALID_DATA for a malformed email", async () => {
    const POST = await loadRoute();

    const res = await POST(deletionRequest({ email: "not-an-email" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "INVALID_DATA" });
  });

  it("propagates Cloudflare's code when the captcha fails", async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue({ ok: false, codes: ["timeout-or-duplicate"] });
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "CAPTCHA_FAILED:timeout-or-duplicate" });
    expect(afterMock).not.toHaveBeenCalled();
  });

  it("answers DB_UNAVAILABLE when the rate limiter cannot reach the database", async () => {
    vi.mocked(checkRateLimit).mockRejectedValue(new Error("connection refused"));
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "DB_UNAVAILABLE" });
  });
});
