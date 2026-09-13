"use client";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { Translations } from "@/lib/i18n/dictionaries";

type T = Translations["deleteAccount"];

/**
 * Step 1: the address. Presentation only — it owns the captcha widget, whose
 * token is short-lived and must be reset after every attempt, and hands the
 * pair up. Everything about what happens next lives in `useAccountDeletion`.
 */
export function StepEmail({
  t,
  busy,
  error,
  onSubmit,
}: {
  t: T;
  busy: boolean;
  error: string;
  onSubmit: (email: string, turnstileToken: string | null) => Promise<void>;
}) {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value.trim();

    await onSubmit(email, turnstileToken);

    // A Turnstile token is single-use: reusing it earns timeout-or-duplicate.
    turnstileRef.current?.reset();
    setTurnstileToken(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ss-email" className="text-sm font-medium text-foreground">
          {t.form.emailLabel}
        </label>
        <input
          id="ss-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t.form.emailPlaceholder}
          disabled={busy}
          className="h-11 rounded-md border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-[border-color,box-shadow] duration-[150ms] focus:border-primary focus:ring-3 focus:ring-primary/25 disabled:opacity-50"
        />
      </div>

      <div className="flex justify-center">
        <Turnstile
          ref={turnstileRef}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
        />
      </div>

      {error && <ErrorNotice>{error}</ErrorNotice>}

      <button
        type="submit"
        disabled={busy}
        className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-primary px-6 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-[150ms] hover:-translate-y-px hover:bg-teal-600 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
      >
        {busy ? t.selfService.submitting : t.selfService.submit}
      </button>
    </form>
  );
}

/** Shared by the three steps: a failure here has to be visible and quotable. */
export function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {children}
    </p>
  );
}
