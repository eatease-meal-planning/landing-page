export const locales = ["de", "en", "es", "fr", "it", "nl", "pl", "pt-pt", "ro", "sv"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const tags = acceptLanguage
    .split(",")
    .map((p) => p.split(";")[0].trim().toLowerCase());

  for (const tag of tags) {
    // Exact match (e.g. "pt-pt" → "pt-pt", "de" → "de")
    if (isValidLocale(tag)) return tag;

    // Primary-language fallback (e.g. "en-us" → "en", "pt-br" → "pt-pt")
    const primary = tag.split("-")[0];
    const match = locales.find((l) => l === primary || l.startsWith(primary + "-"));
    if (match) return match;
  }

  return defaultLocale;
}
