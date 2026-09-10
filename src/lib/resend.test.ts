import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * `new Resend(undefined)` throws ("Missing API key") — so a route that builds
 * the client at module scope dies on import when the key is absent, and the
 * CONFIG_MISSING_RESEND branch inside the handler is never reached. The caller
 * gets a generic 500 instead of the code the page is supposed to show.
 *
 * getResend() moves that construction inside the request, where it can be
 * reported.
 */
describe("getResend", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns null instead of throwing when RESEND_API_KEY is absent", async () => {
    vi.stubEnv("RESEND_API_KEY", "");

    const { getResend } = await import("./resend");

    expect(getResend()).toBeNull();
  });

  it("returns a client when the key is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");

    const { getResend } = await import("./resend");

    expect(getResend()).not.toBeNull();
  });

  it("returns null for a whitespace-only key, which is what an empty Vercel var looks like", async () => {
    vi.stubEnv("RESEND_API_KEY", "   ");

    const { getResend } = await import("./resend");

    expect(getResend()).toBeNull();
  });

  it("reuses one client across calls rather than rebuilding it per request", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");

    const { getResend } = await import("./resend");

    expect(getResend()).toBe(getResend());
  });

  it("builds a new client when the key is rotated under a running process", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_first_key");
    const { getResend } = await import("./resend");
    const first = getResend();

    vi.stubEnv("RESEND_API_KEY", "re_rotated_key");

    expect(getResend()).not.toBe(first);
  });
});
