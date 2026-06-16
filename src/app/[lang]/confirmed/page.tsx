import { getDictionary } from "@/lib/i18n/dictionaries";
import { isValidLocale } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { ConfirmedClient } from "@/components/ConfirmedClient";

export default async function ConfirmedPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale: Locale = isValidLocale(lang) ? lang : "en";
  const { pages } = await getDictionary(locale);
  const t = pages.confirmed;

  return (
    <ConfirmedClient
      title={t.title}
      body={t.body}
      backHome={t.backHome}
      locale={locale}
    />
  );
}
