import { getDictionary } from "@/lib/i18n/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { Nav } from "@/components/landing/Nav";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CtaSection } from "@/components/landing/CtaSection";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default async function Home({
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
      <HeroSection t={dict.hero} />
      <HowItWorksSection t={dict.howItWorks} />
      <FeaturesSection t={dict.features} />
      {/* <TestimonialsSection t={dict.testimonials} /> */}
      <CtaSection t={dict.cta} tForm={dict.form} />
      <SiteFooter t={dict.footer} />
    </div>
  );
}
