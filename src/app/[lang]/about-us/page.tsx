import { getDictionary } from "@/lib/i18n/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { Nav } from "@/components/landing/Nav";
import { AboutSection } from "@/components/landing/AboutSection";
import { Footer } from "@/components/landing/Footer";

export default async function AboutUsPage({
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
      <AboutSection t={dict.aboutUs} locale={locale} joinWaitlist={dict.cta.joinWaitlist} />
      <Footer t={dict.footer} locale={locale} />
    </div>
  );
}
