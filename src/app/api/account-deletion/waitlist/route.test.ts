import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

/**
 * Step 2 of self-service deletion: remove the landing-page `contacts` row.
 *
 * It runs **before** the app account is destroyed, and that order is not
 * negotiable. Once the edge function deletes the auth user, the `sub` in the
 * JWT no longer resolves, `getUser(token)` answers 401, and this row becomes
 * unreachable forever — for us and for the person, who can no longer prove the
 * address is theirs either.
 *
 * The address comes from the verified token and never from the body. A body
 * field would turn a code emailed to one person into a way of erasing anyone.
 */
const { getUserMock, deleteMock, whereMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  deleteMock:  vi.fn(),
  whereMock:   vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: getUserMock } }),
}));

vi.mock("@/db", () => ({
  db: {
    delete: (table: unknown) => {
      deleteMock(table);
      return { where: (condition: SQL) => ({ returning: () => whereMock(condition) }) };
    },
  },
}));

const APP_URL = "https://dagpiagorabmliuotkoc.supabase.co";
const APP_KEY = "anon-key-for-tests";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.header.signature";

async function loadRoute() {
  vi.resetModules();
  return (await import("./route")).POST;
}

function waitlistRequest(
  { token = TOKEN, body }: { token?: string | null; body?: Record<string, unknown> } = {},
) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;

  return new NextRequest("https://test.invalid/api/account-deletion/waitlist", {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** The real SQL the route asked the database to run, text and parameters. */
function renderedCondition(): { sql: string; params: unknown[] } {
  const [condition] = whereMock.mock.calls[0] as [SQL];
  return new PgDialect().sqlToQuery(condition);
}

const VERIFIED_USER = {
  data:  { user: { id: "user-1", email: "someone@example.com" } },
  error: null,
};

/** What the SDK answers for a token that is expired, forged, or already used. */
const REJECTED_TOKEN = {
  data:  { user: null },
  error: { name: "AuthApiError", status: 401, message: "invalid claim: missing sub claim" },
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("NEXT_PUBLIC_APP_SUPABASE_URL", APP_URL);
  vi.stubEnv("NEXT_PUBLIC_APP_SUPABASE_ANON_KEY", APP_KEY);
  getUserMock.mockReset().mockResolvedValue(VERIFIED_USER);
  deleteMock.mockReset();
  whereMock.mockReset().mockResolvedValue([{ id: "contact-1" }]);
});

describe("POST /api/account-deletion/waitlist — only a verified token decides what is erased", () => {
  it("erases the address in the token and ignores the one in the body", async () => {
    const POST = await loadRoute();

    const res = await POST(waitlistRequest({ body: { email: "someone-else@example.com" } }));

    expect(res.status).toBe(200);
    const { params } = renderedCondition();
    expect(params).toContain("someone@example.com");
    expect(params).not.toContain("someone-else@example.com");
  });

  it("verifies the bearer token itself rather than trusting any session", async () => {
    const POST = await loadRoute();

    await POST(waitlistRequest());

    expect(getUserMock).toHaveBeenCalledWith(TOKEN);
  });

  it("matches the row case-insensitively, because the signup form never normalised the address", async () => {
    // /api/contacts inserts the email exactly as typed, while Supabase hands
    // back a lowercased one. An exact match would leave "Someone@Example.com"
    // in the table and report success.
    getUserMock.mockResolvedValue({ data: { user: { id: "u", email: "someone@example.com" } }, error: null });
    const POST = await loadRoute();

    await POST(waitlistRequest());

    expect(renderedCondition().sql).toMatch(/lower\(.*\)\s*=\s*lower\(\$1\)/i);
  });
});

describe("POST /api/account-deletion/waitlist — refusals name their cause", () => {
  it("answers 401 UNAUTHORIZED without a bearer token, and touches no row", async () => {
    const POST = await loadRoute();

    const res = await POST(waitlistRequest({ token: null }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("answers 401 UNAUTHORIZED for a token Supabase rejects", async () => {
    getUserMock.mockResolvedValue(REJECTED_TOKEN);
    const POST = await loadRoute();

    const res = await POST(waitlistRequest());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("answers 401 UNAUTHORIZED when the auth call throws", async () => {
    getUserMock.mockRejectedValue(new Error("network down"));
    const POST = await loadRoute();

    const res = await POST(waitlistRequest());

    expect(res.status).toBe(401);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("answers TOKEN_WITHOUT_EMAIL rather than guessing when the token carries no address", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u", email: undefined } }, error: null });
    const POST = await loadRoute();

    const res = await POST(waitlistRequest());

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "TOKEN_WITHOUT_EMAIL" });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("answers CONFIG_MISSING_APP_SUPABASE when the app project is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_SUPABASE_URL", "");
    const POST = await loadRoute();

    const res = await POST(waitlistRequest());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "CONFIG_MISSING_APP_SUPABASE" });
  });

  it("answers DB_UNAVAILABLE, and not ok, when the delete fails", async () => {
    // The caller must not go on to destroy the app account believing this row
    // is gone: after that, nothing can reach it.
    whereMock.mockRejectedValue(new Error("connection refused"));
    const POST = await loadRoute();

    const res = await POST(waitlistRequest());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ code: "DB_UNAVAILABLE" });
  });
});

describe("POST /api/account-deletion/waitlist — idempotence", () => {
  it("answers ok when there was no row to erase", async () => {
    // Most app users never signed up on the landing page, and a retry after a
    // dropped connection must not fail either.
    whereMock.mockResolvedValue([]);
    const POST = await loadRoute();

    const res = await POST(waitlistRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, removed: 0 });
  });

  it("reports how many rows it erased, which is what proves the step ran", async () => {
    const POST = await loadRoute();

    const res = await POST(waitlistRequest());

    await expect(res.json()).resolves.toEqual({ ok: true, removed: 1 });
  });
});
