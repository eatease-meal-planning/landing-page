import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { en } from "@/lib/i18n/locales/en/index";
import { useAccountDeletion } from "./useAccountDeletion";

/**
 * The three-step machine, and the one rule it exists to protect.
 *
 * `contacts` is erased **before** the app account. Once the edge function
 * removes the auth user, the `sub` in the JWT stops resolving, `getUser(token)`
 * answers 401, and the landing-page row is unreachable forever — by us and by
 * the person, who can no longer prove the address is theirs either. The spec
 * says plainly that neither the API test nor a UI test catches that inversion
 * on its own; the assertion on call order here is what does.
 */
const { verifyOtpMock, invokeMock } = vi.hoisted(() => ({
  verifyOtpMock: vi.fn(),
  invokeMock:    vi.fn(),
}));

vi.mock("@/lib/appSupabase", () => ({
  appSupabaseBrowser: () => ({
    auth:      { verifyOtp: verifyOtpMock },
    functions: { invoke: invokeMock },
  }),
}));

const t = en.deleteAccount;
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.access.token";
const EMAIL = "someone@example.com";

/** Everything the hook asked the network for, in the order it asked. */
let calls: string[];
let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(status: number, body: unknown) {
  return {
    ok:     status >= 200 && status < 300,
    status,
    json:   async () => body,
  } as Response;
}

function renderDeletion() {
  return renderHook(() => useAccountDeletion({ t, locale: "en" }));
}

/** Drives the machine to step 3 with a verified token. */
async function reachConfirmStep() {
  const view = renderDeletion();

  await act(async () => { await view.result.current.requestCode(EMAIL, "turnstile-token"); });
  await act(async () => { await view.result.current.submitCode("123456"); });

  expect(view.result.current.step).toBe("confirm");
  return view;
}

beforeEach(() => {
  calls = [];
  fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push(url);
    return jsonResponse(200, { ok: true, removed: 1 });
  });
  vi.stubGlobal("fetch", fetchMock);

  verifyOtpMock.mockReset().mockResolvedValue({
    data:  { session: { access_token: ACCESS_TOKEN } },
    error: null,
  });
  invokeMock.mockReset().mockImplementation(async () => {
    calls.push("edge:delete-account");
    return { data: { success: true }, error: null };
  });
});

describe("useAccountDeletion — step 1, asking for the code", () => {
  it("moves to the code step and remembers the address", async () => {
    const { result } = renderDeletion();

    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });

    expect(result.current.step).toBe("code");
    expect(result.current.email).toBe(EMAIL);
  });

  it("sends the locale, so the emailed code arrives in the visitor's language", async () => {
    const { result } = renderHook(() => useAccountDeletion({ t, locale: "pt-pt" }));

    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body as string)).toMatchObject({ email: EMAIL, locale: "pt-pt" });
  });

  it("refuses without a captcha token, and asks the server for nothing", async () => {
    const { result } = renderDeletion();

    await act(async () => { await result.current.requestCode(EMAIL, null); });

    expect(result.current.step).toBe("email");
    expect(result.current.error).toBe(t.form.errorCaptcha);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stays put and names the cause when the request is rate limited", async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, { code: "RATE_LIMITED" }));
    const { result } = renderDeletion();

    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });

    expect(result.current.step).toBe("email");
    expect(result.current.error).toBe(t.form.errorRateLimit);
  });

  it("shows the server's code, so a failure is quotable instead of untraceable", async () => {
    fetchMock.mockResolvedValue(jsonResponse(503, { code: "CONFIG_MISSING_APP_SUPABASE" }));
    const { result } = renderDeletion();

    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });

    expect(result.current.error).toContain("CONFIG_MISSING_APP_SUPABASE");
  });
});

describe("useAccountDeletion — step 2, the code", () => {
  it("verifies the code as an email OTP for the address from step 1", async () => {
    const { result } = renderDeletion();
    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });

    await act(async () => { await result.current.submitCode("123456"); });

    expect(verifyOtpMock).toHaveBeenCalledWith({ email: EMAIL, token: "123456", type: "email" });
    expect(result.current.step).toBe("confirm");
  });

  it("stays on the code step when Supabase rejects the code", async () => {
    verifyOtpMock.mockResolvedValue({
      data:  { session: null },
      error: { name: "AuthApiError", message: "Token has expired or is invalid" },
    });
    const { result } = renderDeletion();
    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });

    await act(async () => { await result.current.submitCode("000000"); });

    expect(result.current.step).toBe("code");
    expect(result.current.error).toBe(t.selfService.step2.errorCode);
  });

  it("treats a verified code with no session as a failure, not as permission", async () => {
    // Without a token there is nothing to authorise the deletion with, and
    // proceeding would show the confirm step to someone who cannot delete.
    verifyOtpMock.mockResolvedValue({ data: { session: null }, error: null });
    const { result } = renderDeletion();
    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });

    await act(async () => { await result.current.submitCode("123456"); });

    expect(result.current.step).toBe("code");
  });
});

describe("useAccountDeletion — step 3, and the order that is not negotiable", () => {
  it("erases the waitlist row before it destroys the account", async () => {
    const view = await reachConfirmStep();

    await act(async () => { await view.result.current.confirmDeletion(); });

    expect(calls).toEqual([
      "/api/account-deletion/request",
      "/api/account-deletion/waitlist",
      "edge:delete-account",
    ]);
    expect(view.result.current.step).toBe("done");
  });

  it("destroys nothing when the waitlist row cannot be erased", async () => {
    // Reversed, this is unrecoverable: after the auth user is gone the row can
    // never be reached again, by us or by the person.
    const view = await reachConfirmStep();
    fetchMock.mockResolvedValue(jsonResponse(503, { code: "DB_UNAVAILABLE" }));

    await act(async () => { await view.result.current.confirmDeletion(); });

    expect(invokeMock).not.toHaveBeenCalled();
    expect(view.result.current.step).toBe("confirm");
    expect(view.result.current.error).toContain(t.selfService.step3.errorWaitlist);
  });

  it("authorises both calls with the token the code produced", async () => {
    const view = await reachConfirmStep();

    await act(async () => { await view.result.current.confirmDeletion(); });

    const waitlistCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith("/waitlist"));
    expect(waitlistCall?.[1].headers).toMatchObject({ Authorization: `Bearer ${ACCESS_TOKEN}` });
    expect(invokeMock).toHaveBeenCalledWith(
      "delete-account",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: `Bearer ${ACCESS_TOKEN}` }) }),
    );
  });

  it("reports a failed account deletion instead of claiming success", async () => {
    const view = await reachConfirmStep();
    invokeMock.mockResolvedValue({
      data:  null,
      error: { name: "FunctionsHttpError", message: "Edge Function returned a non-2xx status code" },
    });

    await act(async () => { await view.result.current.confirmDeletion(); });

    expect(view.result.current.step).toBe("confirm");
    expect(view.result.current.error).toBeTruthy();
  });

  it("reaches the done step only after both calls succeeded", async () => {
    const view = await reachConfirmStep();

    await act(async () => { await view.result.current.confirmDeletion(); });

    await waitFor(() => expect(view.result.current.step).toBe("done"));
    expect(view.result.current.busy).toBe(false);
  });
});

describe("useAccountDeletion — going back", () => {
  it("returns to the address step and forgets the one that was typed", async () => {
    const { result } = renderDeletion();
    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });

    act(() => { result.current.restart(); });

    expect(result.current.step).toBe("email");
    expect(result.current.email).toBe("");
    expect(result.current.error).toBe("");
  });
});
