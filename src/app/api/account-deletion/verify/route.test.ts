import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Step 2 of self-service deletion, moved to the server.
 *
 * The browser used to call `verifyOtp` itself, which meant shipping the app
 * project's URL and anon key in the client bundle. Nothing was gained by that:
 * the token this returns is the user's own, obtained by them typing a code that
 * was emailed to them, and it is just as much theirs when the exchange happens
 * here. What is avoided is a credential-shaped string in the bundle of a page
 * whose whole job is data protection.
 */
const { verifyOtpMock } = vi.hoisted(() => ({ verifyOtpMock: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { verifyOtp: verifyOtpMock } }),
}));

const APP_URL = "https://dagpiagorabmliuotkoc.supabase.co";
const APP_KEY = "anon-key-for-tests";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.access.token";

async function loadRoute() {
  vi.resetModules();
  return (await import("./route")).POST;
}

function verifyRequest(body: Record<string, unknown> = {}) {
  return new NextRequest("https://test.invalid/api/account-deletion/verify", {
    method:  "POST",
    headers: { "content-type": "application/json" },
    body:    JSON.stringify({ email: "someone@example.com", code: "123456", ...body }),
  });
}

const VERIFIED = {
  data:  { session: { access_token: ACCESS_TOKEN }, user: { id: "user-1" } },
  error: null,
};

/** What the SDK answers for a wrong code, an expired one, or an unknown address. */
const REJECTED = {
  data:  { session: null, user: null },
  error: { name: "AuthApiError", status: 403, message: "Token has expired or is invalid" },
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("APP_SUPABASE_URL", APP_URL);
  vi.stubEnv("APP_SUPABASE_ANON_KEY", APP_KEY);
  verifyOtpMock.mockReset().mockResolvedValue(VERIFIED);
});

describe("POST /api/account-deletion/verify — exchanging the code for the caller's own token", () => {
  it("verifies the code as an email OTP for the address it was sent to", async () => {
    const POST = await loadRoute();

    await POST(verifyRequest());

    expect(verifyOtpMock).toHaveBeenCalledWith({
      email: "someone@example.com",
      token: "123456",
      type:  "email",
    });
  });

  it("returns the access token, which is the only thing the next step needs", async () => {
    const POST = await loadRoute();

    const res = await POST(verifyRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, accessToken: ACCESS_TOKEN });
  });

  it("answers CODE_INVALID for a code Supabase rejects", async () => {
    verifyOtpMock.mockResolvedValue(REJECTED);
    const POST = await loadRoute();

    const res = await POST(verifyRequest({ code: "000000" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "CODE_INVALID" });
  });

  it("says the same thing for a wrong code and for an address with no account", async () => {
    // Supabase answers both with the same error, and so must we: step 1 refuses
    // to disclose whether an account exists, and step 2 would give it back.
    verifyOtpMock.mockResolvedValue({
      data:  { session: null, user: null },
      error: { name: "AuthApiError", status: 403, message: "Signups not allowed for otp" },
    });
    const POST = await loadRoute();

    const res = await POST(verifyRequest());
    const body = await res.text();

    verifyOtpMock.mockResolvedValue(REJECTED);
    const POST2 = await loadRoute();
    const second = await POST2(verifyRequest());

    expect(await second.text()).toBe(body);
  });

  it("treats a verified code with no session as a failure, not as permission", async () => {
    // Without a token there is nothing to authorise the deletion with, and
    // answering ok would advance the UI for someone who cannot complete it.
    verifyOtpMock.mockResolvedValue({ data: { session: null, user: { id: "u" } }, error: null });
    const POST = await loadRoute();

    const res = await POST(verifyRequest());

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "CODE_INVALID" });
  });

  it("answers CODE_INVALID rather than a bare 500 when the auth call throws", async () => {
    verifyOtpMock.mockRejectedValue(new Error("network down"));
    const POST = await loadRoute();

    const res = await POST(verifyRequest());

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "CODE_INVALID" });
  });
});

describe("POST /api/account-deletion/verify — refusals name their cause", () => {
  it("answers CONFIG_MISSING_APP_SUPABASE when the app project is not configured", async () => {
    vi.stubEnv("APP_SUPABASE_URL", "");
    const POST = await loadRoute();

    const res = await POST(verifyRequest());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "CONFIG_MISSING_APP_SUPABASE" });
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("answers INVALID_DATA for a code that is not six digits", async () => {
    const POST = await loadRoute();

    const res = await POST(verifyRequest({ code: "12ab" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "INVALID_DATA" });
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("answers INVALID_DATA for a malformed email", async () => {
    const POST = await loadRoute();

    const res = await POST(verifyRequest({ email: "not-an-email" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "INVALID_DATA" });
  });
});
