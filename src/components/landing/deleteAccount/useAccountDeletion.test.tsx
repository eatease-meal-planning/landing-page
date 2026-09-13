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
 *
 * Every call goes to our own API: the Supabase client left the browser so the
 * app project's key would stop being served in the bundle. The four URLs below
 * are the whole surface this hook touches.
 */
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

/** What each endpoint answers unless a test overrides it. */
function defaultResponse(url: string) {
  if (url.endsWith("/verify")) return jsonResponse(200, { ok: true, accessToken: ACCESS_TOKEN });
  return jsonResponse(200, { ok: true, removed: 1 });
}

/** Records every URL the hook asks for, in order. */
function recordingFetch(override?: (url: string) => Response | undefined) {
  return vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push(url);
    return override?.(url) ?? defaultResponse(url);
  });
}

beforeEach(() => {
  calls = [];
  fetchMock = recordingFetch();
  vi.stubGlobal("fetch", fetchMock);
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
  it("sends the code and the address from step 1 to our own endpoint", async () => {
    const { result } = renderDeletion();
    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });

    await act(async () => { await result.current.submitCode("123456"); });

    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe("/api/account-deletion/verify");
    expect(JSON.parse(init.body as string)).toEqual({ email: EMAIL, code: "123456" });
    expect(result.current.step).toBe("confirm");
  });

  it("stays on the code step when the code is rejected", async () => {
    const { result } = renderDeletion();
    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });
    fetchMock.mockResolvedValue(jsonResponse(400, { code: "CODE_INVALID" }));

    await act(async () => { await result.current.submitCode("000000"); });

    expect(result.current.step).toBe("code");
    expect(result.current.error).toBe(t.selfService.step2.errorCode);
  });

  it("treats an ok answer with no token as a failure, not as permission", async () => {
    // Without a token there is nothing to authorise the deletion with, and
    // proceeding would show the confirm step to someone who cannot delete.
    const { result } = renderDeletion();
    await act(async () => { await result.current.requestCode(EMAIL, "turnstile-token"); });
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await act(async () => { await result.current.submitCode("123456"); });

    expect(result.current.step).toBe("code");
  });
});

describe("useAccountDeletion — step 3, and the order that is not negotiable", () => {
  it("erases the landing-page registration before it destroys the account", async () => {
    const view = await reachConfirmStep();

    await act(async () => { await view.result.current.confirmDeletion(); });

    expect(calls).toEqual([
      "/api/account-deletion/request",
      "/api/account-deletion/verify",
      "/api/account-deletion/registration",
      "/api/account-deletion/confirm",
    ]);
    expect(view.result.current.step).toBe("done");
  });

  it("destroys nothing when the registration row cannot be erased", async () => {
    // Reversed, this is unrecoverable: after the auth user is gone the row can
    // never be reached again, by us or by the person.
    const view = await reachConfirmStep();
    fetchMock.mockResolvedValue(jsonResponse(503, { code: "DB_UNAVAILABLE" }));

    await act(async () => { await view.result.current.confirmDeletion(); });

    expect(calls).not.toContain("/api/account-deletion/confirm");
    expect(view.result.current.step).toBe("confirm");
    expect(view.result.current.error).toContain(t.selfService.step3.errorRegistration);
  });

  it("authorises both calls with the token the code produced", async () => {
    const view = await reachConfirmStep();

    await act(async () => { await view.result.current.confirmDeletion(); });

    for (const suffix of ["/registration", "/confirm"]) {
      const call = fetchMock.mock.calls.find(([url]) => String(url).endsWith(suffix));
      expect(call?.[1].headers, `${suffix} carries no bearer`).toMatchObject({
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      });
    }
  });

  it("reports a failed account deletion instead of claiming success", async () => {
    const view = await reachConfirmStep();
    fetchMock.mockImplementation(
      recordingFetch((url) =>
        url.endsWith("/confirm") ? jsonResponse(502, { code: "DELETE_ACCOUNT_FAILED:401" }) : undefined,
      ),
    );

    await act(async () => { await view.result.current.confirmDeletion(); });

    expect(view.result.current.step).toBe("confirm");
    expect(view.result.current.error).toContain("DELETE_ACCOUNT_FAILED:401");
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
