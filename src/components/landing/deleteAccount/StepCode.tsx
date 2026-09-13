"use client";

import type { Translations } from "@/lib/i18n/dictionaries";
import { ErrorNotice } from "./StepEmail";

type T = Translations["deleteAccount"];

/**
 * Step 2: the six digits from the email.
 *
 * The wording never says whether an account exists for the address — the API
 * answers identically either way, and a confident "we sent you a code" here
 * would give back exactly the fact the endpoint refuses to disclose.
 */
export function StepCode({
  t,
  busy,
  error,
  onSubmit,
  onRestart,
}: {
  t: T;
  busy: boolean;
  error: string;
  onSubmit: (code: string) => Promise<void>;
  onRestart: () => void;
}) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = (e.currentTarget.elements.namedItem("code") as HTMLInputElement).value.trim();
    await onSubmit(code);
  }

  return (
    <>
      <p className="mt-3 text-[15px] leading-[1.72] text-muted-foreground">{t.selfService.step2.body}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ss-code" className="text-sm font-medium text-foreground">
            {t.selfService.step2.codeLabel}
          </label>
          <input
            id="ss-code"
            name="code"
            type="text"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder={t.selfService.step2.codePlaceholder}
            disabled={busy}
            className="h-11 w-full rounded-md border border-border bg-background px-3.5 font-mono text-base tracking-[0.4em] text-foreground tabular-nums placeholder:tracking-[0.4em] placeholder:text-muted-foreground/50 outline-none transition-[border-color,box-shadow] duration-[150ms] focus:border-primary focus:ring-3 focus:ring-primary/25 disabled:opacity-50"
          />
        </div>

        {error && <ErrorNotice>{error}</ErrorNotice>}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-primary px-6 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-[150ms] hover:-translate-y-px hover:bg-teal-600 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        >
          {busy ? t.selfService.step2.submitting : t.selfService.step2.submit}
        </button>

        <button
          type="button"
          onClick={onRestart}
          disabled={busy}
          className="text-sm font-medium text-muted-foreground underline underline-offset-2 transition-colors duration-[150ms] hover:text-foreground disabled:opacity-50"
        >
          {t.selfService.step2.back}
        </button>
      </form>
    </>
  );
}
