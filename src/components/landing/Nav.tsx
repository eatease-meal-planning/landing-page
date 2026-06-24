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
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const router = useRouter();

  // Close the desktop language dropdown when clicking outside it.
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Close the mobile menu when clicking outside the nav.
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMenuOpen(false); setLangOpen(false); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [menuOpen]);

  function switchLocale(l: Locale) {
    router.push(`/${l}`);
    setLangOpen(false);
    setMenuOpen(false);
  }

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 border-b border-border"
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "saturate(180%) blur(16px)", WebkitBackdropFilter: "saturate(180%) blur(16px)" }}
    >
      <div className="relative z-10 mx-auto flex max-w-310 items-center justify-between px-4 py-3 md:px-8 md:py-4.5">
        <a href={`/${locale}`} aria-label="Eatease home">
          <Image src="/assets/eatease-logo-stack.svg" alt="Eatease" width={2469} height={568} className="h-auto w-32 md:w-37.5" />
        </a>

        {/* ── Right cluster ───────────────────────────────────── */}
        <div className="flex items-center gap-2 md:gap-5">
          {/* Desktop links */}
          <div className="hidden items-center gap-5 md:flex">
            <a href={`/${locale}#how`} className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
              {t.howItWorks}
            </a>
            <a href={`/${locale}#features`} className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
              {t.features}
            </a>
            <a href={`/${locale}/about-us`} className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground">
              {t.aboutUs}
            </a>
          </div>

          {/* Language switcher (desktop + mobile) */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={langOpen}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-3 py-2 text-[13px] font-semibold text-foreground transition-all duration-150 hover:bg-secondary hover:border-gray-300"
            >
              <Globe className="size-3.5" />
              <span>{LANG_CODES[locale]}</span>
              <ChevronDown className="size-3" />
            </button>

            {langOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+6px)] z-60 grid min-w-[320px] max-w-[calc(100vw-2rem)] grid-cols-2 gap-0.5 rounded-xl border border-border bg-white p-1.5 shadow-lg"
              >
                {(locales as readonly Locale[]).map((l) => (
                  <button
                    key={l}
                    role="menuitem"
                    onClick={() => switchLocale(l)}
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

          {/* Desktop CTA */}
          <a
            href={`/${locale}#waitlist`}
            className="hidden items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-600 hover:-translate-y-px hover:shadow-md md:inline-flex"
          >
            {t.joinWaitlist}
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t.closeMenu : t.openMenu}
            className="grid size-11 place-items-center rounded-lg text-foreground transition-colors duration-150 hover:bg-secondary md:hidden"
          >
            <span className="relative block h-4 w-6" aria-hidden="true">
              <span
                className={`absolute left-0 block h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-expo-out ${
                  menuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 block h-0.5 w-6 -translate-y-1/2 rounded-full bg-current transition-all duration-200 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-expo-out ${
                  menuOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* ── Mobile menu panel (full-screen curtain) ───────────── */}
      <div
        id="mobile-menu"
        inert={!menuOpen}
        className={`absolute inset-x-0 top-full z-0 h-[calc(100dvh-100%)] overflow-y-auto bg-white shadow-lg transition-[transform,opacity] duration-300 ease-expo-out md:hidden ${
          menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
          <div className="flex h-full flex-col justify-center gap-2 px-6 pb-50">
            <a
              href={`/${locale}#how`}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-center text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {t.howItWorks}
            </a>
            <a
              href={`/${locale}#features`}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-center text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {t.features}
            </a>
            <a
              href={`/${locale}/about-us`}
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-3 text-center text-base font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {t.aboutUs}
            </a>

            <a
              href={`/${locale}#waitlist`}
              onClick={() => setMenuOpen(false)}
              className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-600"
            >
              {t.joinWaitlist}
            </a>
          </div>
      </div>
    </nav>
  );
}
