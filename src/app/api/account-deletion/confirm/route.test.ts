import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Step 3, the irreversible one: forward the caller's own token to the app
 * project's `delete-account` edge function.
 *
 * A proxy and nothing more. The function reads the subject from the JWT and
 * never from the body, so this handler cannot widen what it deletes — and must
 * not try: the token it forwards is the only thing that decides whose account
 * goes. What it adds is the app project's URL and key staying out of the
 * browser, and a stable code on the way back, where the browser used to get an
 * opaque `FunctionsHttpError`.
 */
const APP_URL = "https://dagpiagorabmliuotkoc.supabase.co";
const APP_KEY = "anon-key-for-tests";
const TOKEN = "eyJhbGciOiJIUzI1NiJ9.access.token";

let fetchMock: ReturnType<typeof vi.fn>;

async function loadRoute() {
  vi.resetModules();
  return (await import("./route")).POST;
}

function confirmRequest({ token = TOKEN }: { token?: string | null } = {}) {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;

  return new NextRequest("https://test.invalid/api/account-deletion/confirm", { method: "POST", headers });
}

function edgeResponse(status: number, body: unknown) {
  return {
    ok:     status >= 200 && status < 300,
    status,
    json:   async () => body,
    text:   async () => JSON.stringify(body),
  } as Response;
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("APP_SUPABASE_URL", APP_URL);
  vi.stubEnv("APP_SUPABASE_ANON_KEY", APP_KEY);
  fetchMock = vi.fn(async () => edgeResponse(200, { success: true }));
  vi.stubGlobal("fetch", fetchMock);
});

describe("POST /api/account-deletion/confirm — forwarding, and nothing else", () => {
  it("calls the app project's delete-account function", async () => {
    const POST = await loadRoute();

    await POST(confirmRequest());

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${APP_URL}/functions/v1/delete-account`);
    expect(init.method).toBe("POST");
  });

  it("carries the caller's token, and the key only to identify the project", async () => {
    const POST = await loadRoute();

    await POST(confirmRequest());

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${TOKEN}`,
      apikey:        APP_KEY,
    });
  });

  it("sends no body, because the function reads the subject from the token", async () => {
    // Anything we put in the body would be ignored — and a handler that looked
    // like it could name an account is a handler someone will later believe.
    const POST = await loadRoute();

    await POST(confirmRequest());

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe("{}");
  });

  it("answers ok once the account is gone", async () => {
    const POST = await loadRoute();

    const res = await POST(confirmRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});

describe("POST /api/account-deletion/confirm — refusals name their cause", () => {
  it("answers 401 UNAUTHORIZED without a bearer token, and calls nothing", async () => {
    const POST = await loadRoute();

    const res = await POST(confirmRequest({ token: null }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes the function's own rejection through as a code, not as success", async () => {
    // The browser used to receive an opaque FunctionsHttpError here, on the one
    // step where "it failed" and "it worked" must never be confused.
    fetchMock.mockResolvedValue(edgeResponse(401, { code: "UNAUTHENTICATED" }));
    const POST = await loadRoute();

    const res = await POST(confirmRequest());

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ code: "DELETE_ACCOUNT_FAILED:401" });
  });

  it("reports a function that is down rather than claiming the account is gone", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    const POST = await loadRoute();

    const res = await POST(confirmRequest());

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toMatchObject({ code: "DELETE_ACCOUNT_FAILED:threw" });
  });

  it("answers CONFIG_MISSING_APP_SUPABASE when the app project is not configured", async () => {
    vi.stubEnv("APP_SUPABASE_ANON_KEY", "");
    const POST = await loadRoute();

    const res = await POST(confirmRequest());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "CONFIG_MISSING_APP_SUPABASE" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
