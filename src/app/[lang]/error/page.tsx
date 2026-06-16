import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

export default async function ErrorPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "en";
  const { pages } = await getDictionary(locale);
  const t = pages.error;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Image
            src="/assets/eatease-logo-horizontal.svg"
            alt="Eatease"
            width={280}
            height={64}
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-6 rounded-xl bg-card px-8 py-12 text-center shadow-card">
          <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <svg className="size-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.title}</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">{t.body}</p>
          </div>

          <Link
            href={`/${locale}`}
            className="mt-2 flex h-11 items-center justify-center rounded-pill bg-primary px-8 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-150 hover:bg-teal-600 hover:-translate-y-px"
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
