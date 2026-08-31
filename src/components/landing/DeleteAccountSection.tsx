"use client";

import { useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { AlertTriangle, Check, Clock, Smartphone, Trash2 } from "lucide-react";
import type { Translations } from "@/lib/i18n/dictionaries";

type T = Translations["deleteAccount"];
type State = "idle" | "loading" | "success" | "error";

const CONTACT_EMAIL = "privacy@eatease.eu";

export function DeleteAccountSection({ t, locale }: { t: T; locale: string }) {
  return (
    <main className="mx-auto w-full max-w-[760px] px-6 py-14 md:px-8 md:py-20">
      <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-foreground md:text-[38px]">
        {t.title}
      </h1>
      <p className="mt-4 text-[15px] leading-[1.72] text-muted-foreground">{t.intro}</p>

      {/* Compliance content — always visible, independent of the form below. */}
      <Card icon={<Trash2 className="size-4" />} title={t.whatIsDeleted.title}>
        <ul className="mt-3 grid gap-2">
          {t.whatIsDeleted.items.map((item) => (
            <li key={item} className="flex gap-2.5 text-[15px] leading-[1.6] text-muted-foreground">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card icon={<Check className="size-4" />} title={t.whatRemains.title}>
        <ul className="mt-3 grid gap-3">
          {t.whatRemains.items.map((item) => (
            <li key={item} className="flex gap-2.5 text-[15px] leading-[1.6] text-muted-foreground">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] leading-[1.6] text-muted-foreground/80">{t.whatRemains.note}</p>
      </Card>

      <Card icon={<Clock className="size-4" />} title={t.timing.title}>
        <p className="mt-3 text-[15px] leading-[1.72] text-muted-foreground">{t.timing.body}</p>
      </Card>

      <Card icon={<Smartphone className="size-4" />} title={t.inApp.title}>
        <p className="mt-3 text-[15px] leading-[1.72] text-muted-foreground">{t.inApp.body}</p>
      </Card>

      <RequestForm t={t} locale={locale} />

      <div className="mt-10 rounded-lg bg-secondary px-6 py-5">
        <h2 className="text-[15px] font-semibold text-foreground">{t.contact.title}</h2>
        <p className="mt-2 text-[15px] leading-[1.7] text-muted-foreground">
          {t.contact.body}{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary underline underline-offset-2 transition-colors hover:text-teal-600"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </main>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-lg bg-background p-6 shadow-card md:p-7">
      <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-foreground">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function RequestForm({ t, locale }: { t: T; locale: string }) {
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

      setErrorMsg(res.status === 429 ? t.form.errorRateLimit : t.form.errorGeneric);
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
      <section className="mt-8 rounded-lg border border-primary/25 bg-accent p-6 md:p-7">
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
    <section className="mt-8 rounded-lg bg-background p-6 shadow-card md:p-7">
      <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-foreground">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
          <AlertTriangle className="size-4" />
        </span>
        {t.form.title}
      </h2>
      <p className="mt-3 text-[15px] leading-[1.72] text-muted-foreground">{t.form.body}</p>

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
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-red-600 px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-[150ms] hover:-translate-y-px hover:bg-red-700 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
        >
          {state === "loading" ? t.form.submitting : t.form.submit}
        </button>
      </form>
    </section>
  );
}
