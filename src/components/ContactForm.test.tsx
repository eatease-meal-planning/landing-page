import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { form as en } from "@/lib/i18n/locales/en/form";
import { ContactForm } from "./ContactForm";

/**
 * Turnstile injects a Cloudflare script and renders an iframe, neither of
 * which exists in jsdom. The stub hands the form a token the way a solved
 * challenge would.
 */
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
    useEffect(() => onSuccess("solved-token"), [onSuccess]);
    return <div data-testid="turnstile" />;
  },
}));

function respondWith(status: number, body: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }),
  );
}

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(en.nameLabel), "Ana");
  await user.type(screen.getByLabelText(en.emailLabel), "ana@example.com");
  await user.click(screen.getByRole("button", { name: en.submit }));
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("ContactForm — a failed signup has to leave the user something to quote", () => {
  it("shows the server's code when the captcha secret is misconfigured", async () => {
    respondWith(400, { error: "…", code: "CAPTCHA_FAILED:invalid-input-secret" });
    render(<ContactForm t={en} locale="en" />);

    await fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("CAPTCHA_FAILED:invalid-input-secret");
  });

  it("shows the server's code when the confirmation email was never sent", async () => {
    respondWith(502, { error: "…", code: "MAIL_FAILED:validation_error" });
    render(<ContactForm t={en} locale="en" />);

    await fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("MAIL_FAILED:validation_error");
  });

  it("shows the server's code when the database is cold", async () => {
    respondWith(503, { error: "…", code: "DB_UNAVAILABLE" });
    render(<ContactForm t={en} locale="en" />);

    await fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("DB_UNAVAILABLE");
  });

  it("keeps the plain duplicate message, which needs no code to act on", async () => {
    respondWith(409, { error: "…", code: "ALREADY_REGISTERED" });
    render(<ContactForm t={en} locale="en" />);

    await fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(en.errorDuplicate);
    expect(alert).not.toHaveTextContent("ALREADY_REGISTERED");
  });

  it("treats a resend cooldown as a duplicate, not as generic rate limiting", async () => {
    // Both answer 429, but they need different advice: one says "check your
    // inbox", the other says "wait a few minutes". The code separates them.
    respondWith(429, { error: "…", code: "COOLDOWN_ACTIVE" });
    render(<ContactForm t={en} locale="en" />);

    await fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(en.errorDuplicate);
  });

  it("shows the success panel when the signup is accepted", async () => {
    respondWith(201, { ok: true });
    render(<ContactForm t={en} locale="en" />);

    await fillAndSubmit();

    await waitFor(() => expect(screen.getByText(en.successTitle)).toBeInTheDocument());
  });

  it("reports a network failure without inventing a code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    render(<ContactForm t={en} locale="en" />);

    await fillAndSubmit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(en.errorNetwork);
  });
});
