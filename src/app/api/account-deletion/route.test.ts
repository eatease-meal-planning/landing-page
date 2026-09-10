import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * The Resend SDK never rejects: `emails.send()` resolves to
 * `{ data, error }` for API rejections *and* for transport failures
 * (node_modules/resend/dist/index.mjs — fetchRequest wraps everything in
 * try/catch). A route that only guards the call with try/catch therefore
 * reports success when nothing was sent.
 *
 * On this route that silence is a compliance failure: the email to the
 * operator IS the deletion mechanism.
 */
// vi.mock is hoisted above module-scope consts, so the spy has to be created
// inside vi.hoisted to exist by the time the factory runs.
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

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

// No test database. The rate limiter is our own boundary, so we stub it here
// rather than the Drizzle client underneath it.
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(false),
}));

// Turnstile is an external API. getClientIp stays real — it is a pure
// function over headers and there is nothing to gain from faking it.
vi.mock("@/lib/turnstile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/turnstile")>()),
  verifyTurnstile: vi.fn().mockResolvedValue({ ok: true, codes: [] }),
}));

/** Re-imports the route so module-scope configuration is re-evaluated. */
async function loadRoute() {
  vi.resetModules();
  return (await import("./route")).POST;
}

const ACCEPTED = { data: { id: "msg_1" }, error: null };

/** What the SDK returns when Resend rejects the message (bad from-domain, revoked key, 429). */
const API_REJECTION = {
  data: null,
  error: { name: "validation_error", statusCode: 403, message: "The from address is not verified." },
};

/** What the SDK returns when the request never reached Resend at all. */
const TRANSPORT_FAILURE = {
  data: null,
  error: { name: "application_error", statusCode: null, message: "Unable to fetch data. The request could not be resolved." },
};

function deletionRequest(body: Record<string, unknown> = {}) {
  return new NextRequest("https://test.invalid/api/account-deletion", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body: JSON.stringify({
      email: "requester@example.com",
      locale: "en",
      cfTurnstileToken: "dummy-token",
      ...body,
    }),
  });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  sendMock.mockReset();
});

describe("POST /api/account-deletion — misconfiguration is reported, not fatal on import", () => {
  it("answers CONFIG_MISSING_RESEND when the API key is absent", async () => {
    // `new Resend(undefined)` throws, so building the client at module scope
    // kills the route on import and this branch never runs — the caller gets a
    // generic 500 with no code to quote.
    vi.stubEnv("RESEND_API_KEY", "");
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "CONFIG_MISSING_RESEND" });
  });
});

describe("POST /api/account-deletion — the operator notification must actually be sent", () => {
  it("does not report success when Resend rejects the operator email", async () => {
    sendMock.mockResolvedValue(API_REJECTION);
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).not.toBe(202);
    await expect(res.json()).resolves.toMatchObject({
      code: expect.stringContaining("OPERATOR_MAIL_FAILED"),
    });
  });

  it("does not report success when the request never reaches Resend", async () => {
    sendMock.mockResolvedValue(TRANSPORT_FAILURE);
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).not.toBe(202);
    await expect(res.json()).resolves.toMatchObject({
      code: expect.stringContaining("OPERATOR_MAIL_FAILED"),
    });
  });

  it("carries Resend's error name in the code, so a failure is diagnosable without the logs", async () => {
    sendMock.mockResolvedValue(API_REJECTION);
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    await expect(res.json()).resolves.toMatchObject({
      code: "OPERATOR_MAIL_FAILED:validation_error",
    });
  });

  it("returns 202 once the operator email is accepted", async () => {
    sendMock.mockResolvedValue(ACCEPTED);
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("still returns 202 when only the acknowledgement to the requester fails", async () => {
    // The acknowledgement is best-effort by design: the request IS recorded
    // with the operator, so telling the user it was lost would be a lie.
    sendMock.mockResolvedValueOnce(ACCEPTED).mockResolvedValueOnce(API_REJECTION);
    const POST = await loadRoute();

    const res = await POST(deletionRequest());

    expect(res.status).toBe(202);
  });

  it("sends the operator notification to the configured inbox, with the requester as reply-to", async () => {
    sendMock.mockResolvedValue(ACCEPTED);
    const POST = await loadRoute();

    await POST(deletionRequest({ email: "someone@example.com" }));

    expect(sendMock.mock.calls[0][0]).toMatchObject({
      to: "privacy@test.invalid",
      replyTo: "someone@example.com",
    });
  });
});
