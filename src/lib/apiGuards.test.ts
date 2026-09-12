import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

/**
 * The pipeline `configuration → rate limit → Zod → Turnstile` was written twice
 * before this file existed (`/api/contacts`, `/api/account-deletion`), and the
 * two copies drifted: one checked configuration, the other didn't; one wrapped
 * the rate limiter in try/catch, the other didn't. Every difference was a
 * failure mode present on one route and absent on the other.
 *
 * The order is the part worth pinning. Configuration comes first because it is
 * what a fresh deploy gets wrong and it must be reachable with a plain curl,
 * before anyone needs a valid captcha token to see it.
 */
vi.mock("@/lib/rateLimit", () => ({ checkRateLimit: vi.fn().mockResolvedValue(false) }));

vi.mock("@/lib/turnstile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/turnstile")>()),
  verifyTurnstile: vi.fn().mockResolvedValue({ ok: true, codes: [] }),
}));

const { checkRateLimit } = await import("@/lib/rateLimit");
const { verifyTurnstile } = await import("@/lib/turnstile");
const { runRequestGuards } = await import("./apiGuards");
type Options = import("./apiGuards").RequestGuardOptions<typeof schema>;

const schema = z.object({
  email:            z.string().email(),
  cfTurnstileToken: z.string().min(1),
});

function request(body: Record<string, unknown> = {}) {
  return new NextRequest("https://test.invalid/api/anything", {
    method:  "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body:    JSON.stringify({ email: "someone@example.com", cfTurnstileToken: "token", ...body }),
  });
}

function guard(overrides: Partial<Options> = {}) {
  return runRequestGuards(request(), {
    name:            "test-route",
    rateLimitPrefix: "test",
    schema,
    ...overrides,
  });
}

beforeEach(() => {
  vi.mocked(checkRateLimit).mockReset().mockResolvedValue(false);
  vi.mocked(verifyTurnstile).mockReset().mockResolvedValue({ ok: true, codes: [] });
});

describe("runRequestGuards — the happy path", () => {
  it("returns the parsed body and the client IP", async () => {
    const result = await guard();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.email).toBe("someone@example.com");
    expect(result.ip).toBe("203.0.113.7");
  });

  it("gives the endpoint its own rate-limit budget via the prefix", async () => {
    // rate_limits.ip is shared with every other endpoint; without the prefix,
    // hammering one form locks the others for the same visitor.
    await guard({ rateLimitPrefix: "del" });

    expect(checkRateLimit).toHaveBeenCalledWith("del:203.0.113.7");
  });
});

describe("runRequestGuards — configuration is checked before anything else", () => {
  it("answers the check's own code, with 503", async () => {
    const result = await guard({ configChecks: [() => "CONFIG_MISSING_OPERATOR"] });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(503);
    await expect(result.response.json()).resolves.toMatchObject({ code: "CONFIG_MISSING_OPERATOR" });
  });

  it("does not spend the caller's rate-limit budget on our own misconfiguration", async () => {
    await guard({ configChecks: [() => "CONFIG_MISSING_OPERATOR"] });

    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("reports the first failing check, so one code names one cause", async () => {
    const result = await guard({
      configChecks: [() => null, () => "CONFIG_MISSING_RESEND", () => "CONFIG_MISSING_OPERATOR"],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    await expect(result.response.json()).resolves.toMatchObject({ code: "CONFIG_MISSING_RESEND" });
  });
});

describe("runRequestGuards — failures carry a code the page can show", () => {
  it("answers DB_UNAVAILABLE when the rate limiter throws", async () => {
    // A paused or cold Supabase project used to surface as an empty-body 500.
    vi.mocked(checkRateLimit).mockRejectedValue(new Error("connection refused"));

    const result = await guard();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(503);
    await expect(result.response.json()).resolves.toMatchObject({ code: "DB_UNAVAILABLE" });
  });

  it("answers RATE_LIMITED with 429 when the caller is over the limit", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue(true);

    const result = await guard();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(429);
    await expect(result.response.json()).resolves.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("answers INVALID_DATA for a body the schema rejects", async () => {
    const result = await runRequestGuards(request({ email: "not-an-email" }), {
      name: "test-route", rateLimitPrefix: "test", schema,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toMatchObject({ code: "INVALID_DATA" });
  });

  it("answers INVALID_DATA for a body that is not JSON at all", async () => {
    const malformed = new NextRequest("https://test.invalid/api/anything", {
      method: "POST", headers: { "content-type": "application/json" }, body: "{ not json",
    });

    const result = await runRequestGuards(malformed, {
      name: "test-route", rateLimitPrefix: "test", schema,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    await expect(result.response.json()).resolves.toMatchObject({ code: "INVALID_DATA" });
  });

  it("propagates Cloudflare's own error codes, which name the misconfiguration", async () => {
    // invalid-input-secret means the site key and the secret are from different
    // widgets — the bug that answered 201 for weeks while sending nothing.
    vi.mocked(verifyTurnstile).mockResolvedValue({ ok: false, codes: ["invalid-input-secret"] });

    const result = await guard();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toMatchObject({
      code: "CAPTCHA_FAILED:invalid-input-secret",
    });
  });

  it("still names the captcha failure when Cloudflare sends no code", async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue({ ok: false, codes: [] });

    const result = await guard();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    await expect(result.response.json()).resolves.toMatchObject({ code: "CAPTCHA_FAILED:unknown" });
  });
});
