import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Confirming is the moment a signup receives its invite: the test is open, so
 * no one has to add the address to the Play Console, and the single email sent
 * here carries both links (opt-in, then download).
 *
 * `resend.emails.send()` resolves `{ data, error }` instead of rejecting, so a
 * Resend outage used to leave the row confirmed and the visitor on the success
 * page with an empty inbox; a second click short-circuits on
 * `contact.confirmed` and never resends. So the order is the fix, not just the
 * error check: send the invite, and only mark the row once it is accepted. The
 * token stays valid for 48h, which makes a failed attempt retryable by
 * clicking the same link again.
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
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("CLOSED_TEST_FROM_EMAIL", "ricardo@test.invalid");
  vi.stubEnv("CLOSED_TEST_OPT_IN_URL", "https://play.google.com/apps/testing/com.test.app");
  vi.stubEnv("CLOSED_TEST_DOWNLOAD_URL", "https://play.google.com/store/apps/details?id=com.test.app");
  sendMock.mockReset();
  setMock.mockReset();
  whereMock.mockReset().mockResolvedValue(undefined);
  findFirstMock.mockReset().mockResolvedValue({ ...PENDING_CONTACT });
});

describe("GET /api/contacts/confirm — a signup is only confirmed once the invite is accepted", () => {
  it("does not mark the contact confirmed when the invite is rejected", async () => {
    sendMock.mockResolvedValue(API_REJECTION);
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(setMock, "the row was marked confirmed with nothing in the visitor's inbox").not.toHaveBeenCalled();
    expect(destination(res)).toBe("/pt-pt/error");
  });

  it("names the failure in the redirect, so it is diagnosable without the logs", async () => {
    sendMock.mockResolvedValue(API_REJECTION);
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(code(res)).toBe("INVITE_FAILED:validation_error");
  });

  it("marks the contact confirmed and invited once the invite is accepted", async () => {
    sendMock.mockResolvedValue(ACCEPTED);
    const GET = await loadRoute();

    const res = await GET(confirmRequest());

    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ confirmed: true, closedTestInvitedAt: expect.any(Date) }),
    );
    expect(destination(res)).toBe("/pt-pt/confirmed");
  });

  it("sends exactly one email, to the visitor", async () => {
    // The operator no longer has anything to do, and the welcome email is the
    // invite now: a second send would mail the visitor twice.
    sendMock.mockResolvedValue(ACCEPTED);
    const GET = await loadRoute();

    await GET(confirmRequest());

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toMatchObject({ to: "ana@example.com" });
  });

  it("sends from the reply-able closed-test address, not the no-reply", async () => {
    sendMock.mockResolvedValue(ACCEPTED);
    const GET = await loadRoute();

    await GET(confirmRequest());

    expect(sendMock.mock.calls[0][0].from).toContain("ricardo@test.invalid");
  });

  it("carries both links, opt-in before download", async () => {
    sendMock.mockResolvedValue(ACCEPTED);
    const GET = await loadRoute();

    await GET(confirmRequest());

    const html: string = sendMock.mock.calls[0][0].html;
    const optIn = html.indexOf("apps/testing/com.test.app");
    const download = html.indexOf("store/apps/details?id=com.test.app");
    expect(optIn).toBeGreaterThan(-1);
    expect(download).toBeGreaterThan(optIn);
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

  it.each(["CLOSED_TEST_OPT_IN_URL", "CLOSED_TEST_DOWNLOAD_URL"])(
    "refuses to confirm when %s is absent — the email would promise a step it cannot deliver",
    async (name) => {
      vi.stubEnv(name, "");
      const GET = await loadRoute();

      const res = await GET(confirmRequest());

      expect(code(res)).toBe("CONFIG_MISSING_TEST_LINKS");
      expect(sendMock).not.toHaveBeenCalled();
      expect(setMock).not.toHaveBeenCalled();
    },
  );
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
