import { describe, expect, it } from "vitest";
import { locales } from "./config";
import { getDictionary } from "./dictionaries";

/**
 * The form no longer opens a waitlist — it enrols closed testers, and the app
 * is on Google Play today. Every string that still promises "we'll tell you
 * when we launch" is now false, and the two legal documents still declared
 * joining a waitlist as the purpose of the processing, which is the one place
 * where a stale sentence is more than sloppy.
 *
 * iOS is the exception that has to stay: there is no TestFlight, so the App
 * Store pair keeps its "coming soon" and is asserted to keep it. A later sweep
 * that renames every store string at once would otherwise announce an iOS
 * build that does not exist.
 */

/** "Waitlist", in the ten languages plus the two legal documents. */
const WAITLIST = [
  "waitlist",
  "warteliste",
  "lista de espera",
  "liste d'attente",
  "lista d'attesa",
  "wachtlijst",
  "oczekując",
  "așteptare",
  "asteptare",
  "väntelista",
  "vantelista",
];

/** "Coming soon", in the ten languages. */
const COMING_SOON = [
  "coming soon",
  "demnächst",
  "próximamente",
  "bientôt",
  "prossimamente",
  "binnenkort",
  "wkrótce",
  "brevemente",
  "în curând",
  "in curand",
  "kommer snart",
];

/** "Closed test", in the ten languages. The test is open now. */
const CLOSED = [
  "closed test",
  "closed testing",
  "geschlossen",
  "prueba cerrada",
  "test fermé",
  "test chiuso",
  "gesloten",
  "zamknięt",
  "teste fechado",
  "închis",
  "sluten",
];

function containsAny(haystack: string, needles: string[]) {
  const lowered = haystack.toLowerCase();
  return needles.some((needle) => lowered.includes(needle));
}

function* walk(node: unknown, path: string): Generator<[string, string]> {
  if (typeof node === "string") {
    yield [path, node];
  } else if (Array.isArray(node)) {
    for (const [i, child] of node.entries()) yield* walk(child, `${path}[${i}]`);
  } else if (node && typeof node === "object") {
    for (const [key, child] of Object.entries(node)) yield* walk(child, path ? `${path}.${key}` : key);
  }
}

describe("nothing still offers a waitlist", () => {
  it.each(locales)("%s", async (locale) => {
    const dict = await getDictionary(locale);

    for (const [path, value] of walk(dict, "")) {
      expect(containsAny(value, WAITLIST), `${locale}: ${path} still offers a waitlist: ${value}`).toBe(false);
    }
  });
});

describe("the store copy matches what each store actually has", () => {
  it.each(locales)("%s — Google Play is live, so it cannot say coming soon", async (locale) => {
    const { hero } = await getDictionary(locale);

    expect(containsAny(hero.googlePlayPre, COMING_SOON), `${locale}: hero.googlePlayPre`).toBe(false);
    expect(containsAny(hero.googlePlayAriaLabel, COMING_SOON), `${locale}: hero.googlePlayAriaLabel`).toBe(false);
    expect(hero.googlePlayAriaLabel.toLowerCase()).toContain("google play");
  });

  it.each(locales)("%s — iOS has nothing, so the App Store must still say coming soon", async (locale) => {
    const { hero } = await getDictionary(locale);

    expect(containsAny(hero.appStorePre, COMING_SOON), `${locale}: hero.appStorePre`).toBe(true);
    expect(containsAny(hero.appStoreAriaLabel, COMING_SOON), `${locale}: hero.appStoreAriaLabel`).toBe(true);
  });

  it.each(locales)("%s — the badge describes the product, not one store", async (locale) => {
    // "Coming soon" is false on Android and true on iOS, and there is one
    // badge for both. It has to say what the product is: a closed test.
    const { hero } = await getDictionary(locale);

    expect(containsAny(hero.badge, COMING_SOON), `${locale}: hero.badge: ${hero.badge}`).toBe(false);
  });
});

describe("the test is open, so nothing the visitor reads still says closed", () => {
  it.each(locales)("%s", async (locale) => {
    const { hero, form, cta, nav, pages, emails } = await getDictionary(locale);
    const copy = {
      "hero.badge": hero.badge,
      "hero.formSubtitle": hero.formSubtitle,
      "hero.googlePlayPre": hero.googlePlayPre,
      "hero.googlePlayAriaLabel": hero.googlePlayAriaLabel,
      "form.submit": form.submit,
      "cta.joinClosedTest": cta.joinClosedTest,
      "nav.joinClosedTest": nav.joinClosedTest,
      "pages.confirmed.body": pages.confirmed.body,
      ...Object.fromEntries(
        Object.entries(emails.closedTestInvite).map(([k, v]) => [`emails.closedTestInvite.${k}`, v]),
      ),
    };

    for (const [path, value] of Object.entries(copy)) {
      expect(containsAny(value, CLOSED), `${locale}: ${path} still says closed: ${value}`).toBe(false);
    }
  });

  it.each(locales)("%s — the confirmation page no longer promises a wait", async (locale) => {
    // The invite leaves in the same request that confirms the address, so a
    // "within 48 hours" here would be a delay that does not exist.
    const { pages } = await getDictionary(locale);

    expect(pages.confirmed.body, `${locale}: pages.confirmed.body`).not.toContain("48");
  });
});
