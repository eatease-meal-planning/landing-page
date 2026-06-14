"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n/dictionaries";

type FormT = Translations["form"];
type State = "idle" | "loading" | "success" | "error";

export function ContactForm({ t }: { t: FormT }) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");

    const form = e.currentTarget;
    const name  = (form.elements.namedItem("name")  as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (res.ok) {
        setState("success");
        return;
      }

      if (res.status === 409) {
        setErrorMsg(t.errorDuplicate);
      } else if (res.status === 429) {
        setErrorMsg(t.errorRateLimit);
      } else {
        setErrorMsg(t.errorGeneric);
      }
      setState("error");
    } catch {
      setErrorMsg(t.errorNetwork);
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-8 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/15">
          <svg className="size-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
        <p className="text-lg font-semibold text-white">{t.successTitle}</p>
        <p className="text-sm text-white/60">{t.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cf-name" className="text-sm font-medium text-white/90">
          {t.nameLabel}
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={50}
          autoComplete="given-name"
          placeholder={t.namePlaceholder}
          disabled={state === "loading"}
          className="h-11 rounded-md border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/40 outline-none transition-[border-color,box-shadow] duration-[150ms] focus:border-primary focus:ring-3 focus:ring-primary/30 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cf-email" className="text-sm font-medium text-white/90">
          {t.emailLabel}
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="email@exemplo.com"
          disabled={state === "loading"}
          className="h-11 rounded-md border border-white/15 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/40 outline-none transition-[border-color,box-shadow] duration-[150ms] focus:border-primary focus:ring-3 focus:ring-primary/30 disabled:opacity-50"
        />
      </div>

      {state === "error" && (
        <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-primary px-6 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-[150ms] hover:bg-teal-600 hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
      >
        {state === "loading" ? (
          <>
            <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {t.submitting}
          </>
        ) : (
          t.submit
        )}
      </button>

      <p className="text-center text-xs text-white/50">{t.disclaimer}</p>
    </form>
  );
}
