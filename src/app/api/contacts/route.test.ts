import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * The waitlist form sat empty in production while the endpoint answered 201.
 * Two failure modes could produce that, and neither reached the user:
 * a wrong TURNSTILE_SECRET_KEY (reported by the server, discarded by the UI)
 * and a Resend rejection (never reported at all, because the SDK resolves
 * `{ data, error }` instead of rejecting).
 *
 * These tests hold both shut: every failure carries a stable code, and no
 * failure is allowed to answer 201.
 */
const { sendMock, checkRateLimitMock, verifyTurnstileMock, findFirstMock, returningMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  verifyTurnstileMock: vi.fn(),
  findFirstMock: vi.fn(),
  returningMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    // Faithful to the real SDK: it throws rather than handing back an
    // unusable client. A permissive stub here would hide the very bug this
    // suite exists to catch.
    constructor(key?: string) {
      if (!key) throw new Error("Missing API key. Pass it to the constructor `new Resend(\"re_123\")`");
    }
    emails = { send: sendMock };
  },
}));

vi.mock("@/lib/rateLimit", () => ({ checkRateLimit: checkRateLimitMock }));

vi.mock("@/lib/turnstile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/turnstile")>()),
  verifyTurnstile: verifyTurnstileMock,
}));

// In-memory stand-in for Drizzle. There is no test database, and the route
// only ever walks two paths through the client.
vi.mock("@/db", () => ({
  db: {
    query: { contacts: { findFirst: findFirstMock } },
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({ returning: returningMock }),
      }),
    }),
  },
}));

const ACCEPTED = { data: { id: "msg_1" }, error: null };
const API_REJECTION = {
  data: null,
  error: { name: "validation_error", statusCode: 403, message: "The from address is not verified." },
};

const NEW_CONTACT = {
  id: "c1",
  name: "Ana",
  email: "ana@example.com",
  locale: "en",
  token: "11111111-1111-1111-1111-111111111111",
};

/** Re-imports the route so module-scope configuration is re-evaluated. */
async function loadRoute() {
  vi.resetModules();
  return (await import("./route")).POST;
}

function signup(body: Record<string, unknown> = {}) {
  return new NextRequest("https://test.invalid/api/contacts", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body: JSON.stringify({
      name: "Ana",
      email: "ana@example.com",
      locale: "en",
      cfTurnstileToken: "dummy-token",
      ...body,
    }),
  });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  sendMock.mockReset().mockResolvedValue(ACCEPTED);
  checkRateLimitMock.mockReset().mockResolvedValue(false);
  verifyTurnstileMock.mockReset().mockResolvedValue({ ok: true, codes: [] });
  findFirstMock.mockReset().mockResolvedValue(undefined);
  returningMock.mockReset().mockResolvedValue([NEW_CONTACT]);
});

describe("POST /api/contacts — misconfiguration is reported, not swallowed", () => {
  it("answers CONFIG_MISSING_RESEND when the API key is absent, instead of dying on import", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "CONFIG_MISSING_RESEND" });
  });

  it("answers CONFIG_MISSING_RESEND when the sender address is absent", async () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "CONFIG_MISSING_RESEND" });
  });

  it("answers DB_UNAVAILABLE when the database is cold rather than an empty 500", async () => {
    checkRateLimitMock.mockRejectedValue(new Error("connection terminated unexpectedly"));
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "DB_UNAVAILABLE" });
  });
});

describe("POST /api/contacts — a signup is only confirmed once the email is away", () => {
  it("does not answer 201 when Resend rejects the confirmation email", async () => {
    sendMock.mockResolvedValue(API_REJECTION);
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).not.toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      code: "MAIL_FAILED:validation_error",
    });
  });

  it("answers 201 once the confirmation email is accepted", async () => {
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});

describe("POST /api/contacts — existing guards keep their codes", () => {
  it("propagates Cloudflare's error code so a wrong secret is diagnosable", async () => {
    verifyTurnstileMock.mockResolvedValue({ ok: false, codes: ["invalid-input-secret"] });
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: "CAPTCHA_FAILED:invalid-input-secret",
    });
  });

  it("answers RATE_LIMITED when the visitor is over the window", async () => {
    checkRateLimitMock.mockResolvedValue(true);
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("answers INVALID_DATA for a malformed body", async () => {
    const POST = await loadRoute();

    const res = await POST(signup({ email: "not-an-email" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "INVALID_DATA" });
  });

  it("answers COOLDOWN_ACTIVE for a resend inside the one-hour window", async () => {
    // The only path that reads existing.tokenExpiresAt. It sits inside the
    // upsert try/catch, so a TypeError here would surface as a misleading
    // DB_UNAVAILABLE rather than as a crash anyone would notice.
    findFirstMock.mockResolvedValue({
      ...NEW_CONTACT,
      confirmed: false,
      // lastSentAt = tokenExpiresAt - 48h, so this is a token issued 30 min ago.
      tokenExpiresAt: new Date(Date.now() + 47.5 * 60 * 60 * 1000),
    });
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toMatchObject({ code: "COOLDOWN_ACTIVE" });
  });

  it("resends once the cooldown has expired", async () => {
    findFirstMock.mockResolvedValue({
      ...NEW_CONTACT,
      confirmed: false,
      // Issued two hours ago — outside the one-hour cooldown.
      tokenExpiresAt: new Date(Date.now() + 46 * 60 * 60 * 1000),
    });
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).toBe(201);
  });

  it("answers ALREADY_REGISTERED for an address that already confirmed", async () => {
    findFirstMock.mockResolvedValue({ ...NEW_CONTACT, confirmed: true });
    const POST = await loadRoute();

    const res = await POST(signup());

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ code: "ALREADY_REGISTERED" });
  });
});
