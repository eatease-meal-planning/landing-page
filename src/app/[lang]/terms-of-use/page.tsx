import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { Nav } from "@/components/landing/Nav";
import { TermsOfUseSection } from "@/components/landing/TermsOfUseSection";
import { Footer } from "@/components/landing/Footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "en";
  const dict = await getDictionary(locale);
  return { title: `${dict.legal.termsTitle} — EatEase` };
}

export default async function TermsOfUsePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "en";
  const dict = await getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Nav locale={locale} t={dict.nav} />
      <TermsOfUseSection content={dict.termsOfUse} t={dict.legal} locale={locale} />
      <Footer t={dict.footer} locale={locale} />
    </div>
  );
}
