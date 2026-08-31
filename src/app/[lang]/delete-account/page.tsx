import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { Nav } from "@/components/landing/Nav";
import { DeleteAccountSection } from "@/components/landing/DeleteAccountSection";
import { Footer } from "@/components/landing/Footer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "en";
  const dict = await getDictionary(locale);
  return {
    title: `${dict.deleteAccount.title} — EatEase`,
    description: dict.deleteAccount.intro,
  };
}

export default async function DeleteAccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "en";
  const dict = await getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col bg-secondary">
      <Nav locale={locale} t={dict.nav} />
      <DeleteAccountSection t={dict.deleteAccount} locale={locale} />
      <Footer t={dict.footer} locale={locale} />
    </div>
  );
}
