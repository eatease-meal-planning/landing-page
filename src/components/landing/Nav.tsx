"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Globe, ChevronDown } from "lucide-react";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import type { Translations } from "@/lib/i18n/dictionaries";

const LANG_NAMES: Record<Locale, string> = {
  de: "Deutsch", en: "English", es: "Español", fr: "Français",
  it: "Italiano", nl: "Nederlands", pl: "Polski",
  "pt-pt": "Português", ro: "Română", sv: "Svenska",
};

const LANG_CODES: Record<Locale, string> = {
  de: "DE", en: "EN", es: "ES", fr: "FR", it: "IT",
  nl: "NL", pl: "PL", "pt-pt": "PT", ro: "RO", sv: "SV",
};

interface NavProps {
  locale: Locale;
  t: Translations["nav"];
}

export function Nav({ locale, t }: NavProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-border"
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "saturate(180%) blur(16px)", WebkitBackdropFilter: "saturate(180%) blur(16px)" }}
    >
      <div className="mx-auto flex max-w-310 items-center justify-between px-8 py-4.5">
        <a href={`/${locale}`} aria-label="Eatease home">
          <Image src="/assets/eatease-logo-stack.svg" alt="Eatease" width={2469} height={568} className="h-auto w-37.5" />
        </a>

        <div className="flex items-center gap-5">
          <a href={`/${locale}#how`} className="hidden text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground md:block">
            {t.howItWorks}
          </a>
          <a href={`/${locale}#features`} className="hidden text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground md:block">
            {t.features}
          </a>
          <a href={`/${locale}#cta`} className="hidden text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground md:block">
            {t.pricing}
          </a>

          {/* Language switcher */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] font-semibold text-foreground transition-all duration-150 hover:bg-secondary hover:border-gray-300"
            >
              <Globe className="size-3.5" />
              <span>{LANG_CODES[locale]}</span>
              <ChevronDown className="size-3" />
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+6px)] z-60 grid min-w-[320px] grid-cols-2 gap-0.5 rounded-xl border border-border bg-white p-1.5 shadow-lg"
              >
                {(locales as readonly Locale[]).map((l) => (
                  <button
                    key={l}
                    role="menuitem"
                    onClick={() => { router.push(`/${l}`); setOpen(false); }}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13px] text-foreground transition-colors hover:bg-secondary ${
                      l === locale ? "bg-accent text-accent-foreground font-semibold" : ""
                    }`}
                  >
                    {LANG_NAMES[l]}
                    <span className={`ml-auto font-mono text-[10px] uppercase ${l === locale ? "text-accent-foreground" : "text-muted-foreground"}`}>
                      {LANG_CODES[l]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            href={`/${locale}#waitlist`}
            className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-600 hover:-translate-y-px hover:shadow-md"
          >
            {t.joinWaitlist}
          </a>
        </div>
      </div>
    </nav>
  );
}
