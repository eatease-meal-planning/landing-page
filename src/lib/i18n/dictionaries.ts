import type { Locale } from "./config";
import type { en } from "./locales/en/index";

export type Translations = typeof en;

const dictionaries: Record<Locale, () => Promise<Translations>> = {
  de:      () => import("./locales/de/index").then((m) => m.de),
  en:      () => import("./locales/en/index").then((m) => m.en),
  es:      () => import("./locales/es/index").then((m) => m.es),
  fr:      () => import("./locales/fr/index").then((m) => m.fr),
  it:      () => import("./locales/it/index").then((m) => m.it),
  nl:      () => import("./locales/nl/index").then((m) => m.nl),
  pl:      () => import("./locales/pl/index").then((m) => m.pl),
  "pt-pt": () => import("./locales/pt-pt/index").then((m) => m.ptPt),
  ro:      () => import("./locales/ro/index").then((m) => m.ro),
  sv:      () => import("./locales/sv/index").then((m) => m.sv),
};

export async function getDictionary(locale: Locale): Promise<Translations> {
  return dictionaries[locale]?.() ?? dictionaries["en"]();
}
