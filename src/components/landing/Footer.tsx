import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import type { Translations } from "@/lib/i18n/dictionaries";
import { CookiePreferencesButton } from "@/components/CookiePreferencesButton";

interface FooterProps {
  t: Translations["footer"];
  locale: Locale;
}

export function Footer({ t, locale }: FooterProps) {
  return (
    <footer className="bg-gray-900 px-8 pb-8 pt-18 text-white/70">
      <div className="mx-auto max-w-310">
        {/* Logo */}
        <div className="mb-10 border-b border-white/8 pb-10">
          <Image
            src="/assets/eatease-logo-horizontal.svg"
            alt="Eatease — Time saved, meals made!"
            width={2046}
            height={605}
            className="block h-24 w-auto brightness-0 invert opacity-90 mx-auto md:h-36 lg:h-44"
          />
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
          <div>
            <h4 className="mb-4 text-[13px] font-semibold text-white">{t.col1}</h4>
            <ul className="flex flex-col gap-2.5">
              <li><a href={`/${locale}#features`} className="text-[14px] text-white/60 transition-colors hover:text-white">{t.mealPlanning}</a></li>
              <li><a href={`/${locale}#features`} className="text-[14px] text-white/60 transition-colors hover:text-white">{t.snapFridge}</a></li>
              <li><a href={`/${locale}#features`} className="text-[14px] text-white/60 transition-colors hover:text-white">{t.macroTracking}</a></li>
              <li><a href={`/${locale}#features`} className="text-[14px] text-white/60 transition-colors hover:text-white">{t.shoppingList}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[13px] font-semibold text-white">{t.col2}</h4>
            <ul className="flex flex-col gap-2.5">
              <li><a href={`/${locale}/about-us`} className="text-[14px] text-white/60 transition-colors hover:text-white">{t.about}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[13px] font-semibold text-white">{t.col3}</h4>
            <ul className="flex flex-col gap-2.5">
              <li><a href={`/${locale}/privacy-policy`} className="text-[14px] text-white/60 transition-colors hover:text-white">{t.privacy}</a></li>
              <li><a href={`/${locale}/terms-of-use`} className="text-[14px] text-white/60 transition-colors hover:text-white">{t.terms}</a></li>
              <li><a href={`/${locale}/cookie-policy`} className="text-[14px] text-white/60 transition-colors hover:text-white">{t.cookiePolicy}</a></li>
              <li><a href={`/${locale}/#cta`} className="text-[14px] text-white/60 transition-colors hover:text-white">{t.contact}</a></li>
              <li><CookiePreferencesButton text={t.cookiePreferences} /></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[13px] font-semibold text-white">{t.col4}</h4>
            <ul className="flex flex-col gap-2.5">
              <li><a href="#" className="text-[14px] text-white/60 transition-colors hover:text-white">{t.iosStore}</a></li>
              <li><a href="#" className="text-[14px] text-white/60 transition-colors hover:text-white">{t.androidStore}</a></li>
            </ul>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-7 text-[12px] sm:flex-row">
          <span>© {new Date().getFullYear()} EatEase. {t.copyright}</span>
          <span>{t.madeWith}</span>
        </div>
        <p className="mt-3 text-center text-[11px] text-white/30">
          {t.createdBy}{" "}
          <a
            href="https://www.ricardorato.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 underline-offset-2 transition-colors hover:text-white/80 hover:underline"
          >
            Ricardo Rato
          </a>
        </p>
      </div>
    </footer>
  );
}
