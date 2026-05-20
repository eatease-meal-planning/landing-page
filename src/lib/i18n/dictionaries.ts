import type { Locale } from "./config";
import type { pt } from "./locales/pt/index";

export type Translations = typeof pt;

const dictionaries = {
  pt: () => import("./locales/pt/index").then((m) => m.pt),
  en: () => import("./locales/en/index").then((m) => m.en),
};

export async function getDictionary(locale: Locale): Promise<Translations> {
  return dictionaries[locale]?.() ?? dictionaries["pt"]();
}
