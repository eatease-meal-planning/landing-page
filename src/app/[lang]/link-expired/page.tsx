import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

export default async function LinkExpiredPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "en";
  const { pages } = await getDictionary(locale);
  const t = pages.linkExpired;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Image src="/assets/eatease-logo-horizontal.svg" alt="EatEase" width={140} height={32} priority />
        </div>

        <div className="flex flex-col items-center gap-6 rounded-xl bg-card px-8 py-12 text-center shadow-card">
          <span className="flex size-16 items-center justify-center rounded-full bg-amber-50">
            <svg className="size-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{t.body}</p>
          </div>

          <Link
            href={`/${locale}`}
            className="mt-2 flex h-11 items-center justify-center rounded-pill bg-primary px-8 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-[150ms] hover:bg-teal-600 hover:-translate-y-px"
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
