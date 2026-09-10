import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Confirming is the moment a signup becomes a tester, and the email to the
 * operator is what makes that happen — the address has to be added to the
 * closed-test list in the Play Console by hand.
 *
 * The route used to write `confirmed = true` first and then fire both emails
 * through `Promise.all` without looking at the result. `resend.emails.send()`
 * resolves `{ data, error }` instead of rejecting, so a Resend outage left the
 * row confirmed, the operator's inbox empty, and the visitor on the success
 * page. A second click short-circuits on `contact.confirmed` and never
 * resends: that person is a tester who will never be added, and nothing in the
 * database says so.
 *
 * So the order is the fix, not just the error check: notify the operator, and
 * only mark the row once that message is accepted. The token stays valid for
 * 48h, which makes a failed attempt retryable by clicking the same link again.
 */
const { sendMock, findFirstMock, setMock, whereMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
  findFirstMock: vi.fn(),
  setMock: vi.fn(),
  whereMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    constructor(key?: string) {
      if (!key) throw new Error("Missing API key. Pass it to the constructor `new Resend(\"re_123\")`");
    }
    emails = { send: sendMock };
  },
}));

// In-memory stand-in for Drizzle: the route walks one read and one update.
vi.mock("@/db", () => ({
  db: {
    query: { contacts: { findFirst: findFirstMock } },
    update: () => ({
      set: (values: unknown) => {
        setMock(values);
        return { where: whereMock };
      },
    }),
  },
}));

const ACCEPTED = { data: { id: "msg_1" }, error: null };

/** What the SDK returns when Resend rejects the message. */
const API_REJECTION = {
  data: null,
  error: { name: "validation_error", statusCode: 403, message: "The from address is not verified." },
};

const TOKEN = "11111111-1111-1111-1111-111111111111";

const PENDING_CONTACT = {
  id: "c1",
  name: "Ana",
  email: "ana@example.com",
  locale: "pt-pt",
  confirmed: false,
  token: TOKEN,
  tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

async function loadRoute() {
  vi.resetModules();
  return (await import("./route")).GET;
}

function confirmRequest(token: string | null = TOKEN) {
  const url = token
    ? `https://test.invalid/api/contacts/confirm?token=${token}`
    : "https://test.invalid/api/contacts/confirm";
  return new NextRequest(url);
}

/** The redirect target, without the origin. */
function destination(res: Response) {
  return new URL(res.headers.get("location") ?? "", "https://test.invalid").pathname;
}

function code(res: Response) {
  return new URL(res.headers.get("location") ?? "", "https://test.invalid").searchParams.get("code");
}

beforeEach(() => {
  vi.unstubAllEnvs();
  sendMock.mockReset();
  setMock.mockReset();
  whereMock.mockReset().mockResolvedValue(undefined);
  findFirstMock.mockReset().mockResolvedValue({ ...PENDING_CONTACT });
});

describe("GET /api/contacts/confirm — a signup is only confirmed once the operator knows", () => {
  it("does not mark the contact confirmed when the operator notification is rejected", async () => {
    sendMock.mockResolvedValue(API_REJECTION);
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(setMock, "the row was marked confirmed with nothing in the operator's inbox").not.toHaveBeenCalled();
    expect(destination(res)).toBe("/pt-pt/error");
  });

  it("names the failure in the redirect, so it is diagnosable without the logs", async () => {
    sendMock.mockResolvedValue(API_REJECTION);
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(code(res)).toBe("SIGNUP_NOTIFICATION_FAILED:validation_error");
  });

  it("marks the contact confirmed once the operator notification is accepted", async () => {
    sendMock.mockResolvedValue(ACCEPTED);
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({ confirmed: true }));
    expect(destination(res)).toBe("/pt-pt/confirmed");
  });

  it("still confirms when only the welcome email to the visitor fails", async () => {
    // The welcome email is best-effort: the signup IS recorded with the
    // operator, so sending the visitor to an error page would be a lie.
    sendMock.mockResolvedValueOnce(ACCEPTED).mockResolvedValueOnce(API_REJECTION);
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({ confirmed: true }));
    expect(destination(res)).toBe("/pt-pt/confirmed");
  });

  it("sends exactly two emails — the operator notification and the welcome", async () => {
    // The task that rewrites the operator email reads as "add an email to the
    // confirm route". It already sends one; a third send means the operator
    // gets two notifications per signup.
    sendMock.mockResolvedValue(ACCEPTED);
    const GET = await loadRoute();

    await GET(confirmRequest());

    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});

describe("GET /api/contacts/confirm — the operator inbox has its own variable", () => {
  it("notifies the address in SIGNUP_NOTIFICATION_TO_EMAIL, not the welcome sender", async () => {
    vi.stubEnv("SIGNUP_NOTIFICATION_TO_EMAIL", "testers@test.invalid");
    sendMock.mockResolvedValue(ACCEPTED);
    const GET = await loadRoute();

    await GET(confirmRequest());

    expect(sendMock.mock.calls[0][0]).toMatchObject({ to: "testers@test.invalid" });
  });

  it("carries the address to add in the subject, so the inbox is scannable", async () => {
    sendMock.mockResolvedValue(ACCEPTED);
    const GET = await loadRoute();

    await GET(confirmRequest());

    expect(sendMock.mock.calls[0][0].subject).toContain("ana@example.com");
  });
});

describe("GET /api/contacts/confirm — misconfiguration is reported, not fatal on import", () => {
  it("redirects with CONFIG_MISSING_RESEND when the API key is absent", async () => {
    // `new Resend(undefined)` throws, so building the client at module scope
    // took the whole route down on import — every confirmation link 500ing
    // with nothing to quote.
    vi.stubEnv("RESEND_API_KEY", "");
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(code(res)).toBe("CONFIG_MISSING_RESEND");
    expect(setMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/contacts/confirm — the paths that were already right stay right", () => {
  it("sends an already-confirmed visitor to the success page without resending", async () => {
    findFirstMock.mockResolvedValue({ ...PENDING_CONTACT, confirmed: true });
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(destination(res)).toBe("/pt-pt/confirmed");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends an expired token to the link-expired page", async () => {
    findFirstMock.mockResolvedValue({ ...PENDING_CONTACT, tokenExpiresAt: new Date(Date.now() - 1000) });
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(destination(res)).toBe("/pt-pt/link-expired");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends an unknown token to the error page in the default locale", async () => {
    findFirstMock.mockResolvedValue(undefined);
    const GET = await loadRoute();

    const res = await GET(confirmRequest("no-such-token"));

    expect(destination(res)).toBe("/en/error");
    expect(sendMock).not.toHaveBeenCalled();
  });
});
