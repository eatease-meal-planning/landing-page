"use client";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { Check } from "lucide-react";
import type { Translations } from "@/lib/i18n/dictionaries";

type T = Translations["deleteAccount"];
type State = "idle" | "loading" | "success" | "error";

/**
 * The human fallback, unchanged in behaviour and moved under a disclosure.
 *
 * It stays in phase 2 for the two cases the code cannot serve: someone who has
 * lost access to the address on the account, and someone who signed up on this
 * website without ever creating an account in the app. Its promise is still the
 * statutory 30 days, because it is still processed by hand.
 */
export function ManualRequestForm({ t, locale }: { t: T; locale: string }) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!turnstileToken) {
      setErrorMsg(t.form.errorCaptcha);
      setState("error");
      return;
    }

    setState("loading");

    const form   = e.currentTarget;
    const email  = (form.elements.namedItem("email")  as HTMLInputElement).value.trim();
    const reason = (form.elements.namedItem("reason") as HTMLTextAreaElement).value.trim();

    try {
      const res = await fetch("/api/account-deletion", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, reason: reason || undefined, locale, cfTurnstileToken: turnstileToken }),
      });

      if (res.ok) {
        setState("success");
        return;
      }

      if (res.status === 429) {
        setErrorMsg(t.form.errorRateLimit);
      } else {
        // Append the server's code. This page carries a legal promise, so a
        // failed request has to leave the user something they can quote to us
        // rather than an untraceable "something went wrong".
        const code = await res.json().then((d) => d?.code).catch(() => null);
        setErrorMsg(code ? `${t.form.errorGeneric} (${code})` : t.form.errorGeneric);
      }
      setState("error");
    } catch {
      setErrorMsg(t.form.errorNetwork);
      setState("error");
    } finally {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    }
  }

  if (state === "success") {
    return (
      <section className="mt-4 rounded-lg border border-primary/25 bg-accent p-6 md:p-7">
        <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-foreground">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" />
          </span>
          {t.form.successTitle}
        </h2>
        <p className="mt-3 text-[15px] leading-[1.72] text-accent-foreground">{t.form.successBody}</p>
      </section>
    );
  }

  return (
    <details className="group mt-4 rounded-lg bg-background p-6 shadow-card md:p-7">
      <summary className="cursor-pointer list-none text-[15px] font-medium text-foreground underline underline-offset-4 decoration-muted-foreground/40 transition-colors duration-[150ms] hover:decoration-foreground">
        {t.manual.disclosure}
      </summary>

      <h3 className="mt-5 text-[15px] font-semibold text-foreground">{t.form.title}</h3>
      <p className="mt-2 text-[15px] leading-[1.72] text-muted-foreground">{t.form.body}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="da-email" className="text-sm font-medium text-foreground">
            {t.form.emailLabel}
          </label>
          <input
            id="da-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t.form.emailPlaceholder}
            disabled={state === "loading"}
            className="h-11 rounded-md border border-border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-[border-color,box-shadow] duration-[150ms] focus:border-primary focus:ring-3 focus:ring-primary/25 disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="da-reason" className="text-sm font-medium text-foreground">
            {t.form.reasonLabel}
          </label>
          <textarea
            id="da-reason"
            name="reason"
            rows={3}
            maxLength={1000}
            placeholder={t.form.reasonPlaceholder}
            disabled={state === "loading"}
            className="resize-y rounded-md border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-[border-color,box-shadow] duration-[150ms] focus:border-primary focus:ring-3 focus:ring-primary/25 disabled:opacity-50"
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

        {state === "error" && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={state === "loading"}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-primary px-6 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-[150ms] hover:-translate-y-px hover:bg-teal-600 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        >
          {state === "loading" ? t.form.submitting : t.form.submit}
        </button>
      </form>
    </details>
  );
}
