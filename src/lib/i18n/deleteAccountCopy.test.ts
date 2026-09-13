import { describe, expect, it } from "vitest";
import { locales, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

/**
 * The two places the deletion page tells a person how to contest a request they
 * did not make: the success panel on the page, and the acknowledgement email.
 *
 * Neither may say "ignore it". Forwarding the request to the operator IS the
 * deletion mechanism (`api/account-deletion/route.ts` — it happens before the
 * acknowledgement is even rendered), so by the time anyone reads either string
 * the request is already standing in the operator's inbox. Someone targeted by
 * a malicious request who follows an "ignore it" instruction does nothing, and
 * the request proceeds. Contesting takes an action: replying.
 *
 * `tsc` cannot see any of this — the keys are present and typed in all ten
 * locales, and the sentence they hold is simply false in nine of them.
 */

/** Roots of "to ignore" across the ten locales, matched case-insensitively. */
const IGNORE_ROOTS = ["ignor", "negeer", "negeren", "bortse"];

/** How each locale says "reply". Roots, so conjugation and register can vary. */
const REPLY_ROOTS: Record<Locale, string[]> = {
  de:      ["antwort"],
  en:      ["reply"],
  es:      ["respond"],
  fr:      ["répond"],
  it:      ["rispond"],
  nl:      ["beantwoord"],
  pl:      ["odpowied"],
  "pt-pt": ["respond"],
  ro:      ["răspunde", "raspunde"],
  sv:      ["svara"],
};

/**
 * The statutory deadline stated on the page and in the email.
 *
 * Phase 2 did **not** retire it. Self-service deletion is immediate, but the
 * request form stayed — for someone who lost access to the address on the
 * account, and for someone who signed up here without ever creating an account
 * in the app — and that path is still processed by hand, so 30 days (GDPR art.
 * 12(3)) is still what it promises. `timing.body` now describes both.
 */
const DEADLINE = "30";

/** Both surfaces, resolved from the dictionary rather than grepped from disk. */
async function contestationCopy(locale: Locale) {
  const dict = await getDictionary(locale);
  return {
    page:  dict.deleteAccount.form.successBody,
    email: dict.emails.deletionRequest.ignore,
    emailBody: dict.emails.deletionRequest.body,
  };
}

function containsAny(haystack: string, needles: string[]) {
  const lowered = haystack.toLowerCase();
  return needles.some((needle) => lowered.includes(needle));
}

describe("no locale tells the recipient that ignoring the email is enough", () => {
  it.each(locales)("%s — the page's success panel", async (locale) => {
    const { page } = await contestationCopy(locale);

    expect(containsAny(page, IGNORE_ROOTS), `${locale}: deleteAccount.form.successBody says to ignore: ${page}`).toBe(false);
    expect(containsAny(page, REPLY_ROOTS[locale]), `${locale}: deleteAccount.form.successBody never says to reply: ${page}`).toBe(true);
  });

  it.each(locales)("%s — the acknowledgement email", async (locale) => {
    const { email } = await contestationCopy(locale);

    expect(containsAny(email, IGNORE_ROOTS), `${locale}: emails.deletionRequest.ignore says to ignore: ${email}`).toBe(false);
    expect(containsAny(email, REPLY_ROOTS[locale]), `${locale}: emails.deletionRequest.ignore never says to reply: ${email}`).toBe(true);
  });
});

describe("every locale states the same processing deadline", () => {
  // pt-pt described a confirmation step that Phase 1 does not have ("após
  // confirmares, será tudo eliminado de imediato") on both surfaces, promising
  // a safeguard nobody would get.
  it.each(locales)("%s", async (locale) => {
    const { page, emailBody } = await contestationCopy(locale);

    expect(page, `${locale}: deleteAccount.form.successBody omits the deadline`).toContain(DEADLINE);
    expect(emailBody, `${locale}: emails.deletionRequest.body omits the deadline`).toContain(DEADLINE);
  });
});

/**
 * The closed-test tester list lives in the Google Play Console, outside both
 * databases, and nothing reaches it automatically: `edits.testers` in the Play
 * Developer API only accepts Google Groups, and there is no group. Removing a
 * tester is a manual step by the operator, forever.
 *
 * Two consequences the copy has to carry. The page must say the tester list is
 * part of what gets deleted — otherwise "your registration on this website" is
 * a promise that stops at the row in `contacts`. And the in-app shortcut has to
 * stop reading as the better option: `app/supabase/functions/delete-account`
 * removes the auth user and storage in the app's own Supabase project, which
 * cannot see the landing-page `contacts` row and certainly cannot see the Play
 * Console. Someone who deletes in the app stays a tester with access to the
 * build.
 */
describe("deletion reaches the closed-test tester list, or says so", () => {
  it.each(locales)("%s — the list of what gets deleted names Google Play", async (locale) => {
    const dict = await getDictionary(locale);
    const items = dict.deleteAccount.whatIsDeleted.items.join(" ");

    expect(items, `${locale}: deleteAccount.whatIsDeleted never mentions the tester list`).toContain("Google Play");
  });

  it.each(locales)("%s — the in-app shortcut warns that it does not reach the tester list", async (locale) => {
    const dict = await getDictionary(locale);

    expect(dict.deleteAccount.inApp.body, `${locale}: deleteAccount.inApp.body`).toContain("Google Play");
  });
});

/**
 * Phase 2 deletes immediately, but not completely, and the final step is the
 * only place the difference can still be read before the irreversible button.
 *
 * Two things it has to say, both verified here in all ten locales because
 * `tsc` sees a present, typed, and possibly empty string:
 *
 * - **The trial record.** It is keyed partly on the sign-in provider
 *   identifier, which lives in `auth.identities` and disappears with the
 *   account. An article 21 objection raised afterwards can no longer be matched
 *   to the person. The manual flow gave the operator that window; self-service
 *   removes it, so the page has to hand the window to the user instead.
 * - **The tester list.** It lives in the Play Console, which has no API we can
 *   reach, so removal is manual — and "immediate and complete" would be false.
 */
describe("the final step warns about what immediate deletion still does not reach", () => {
  it.each(locales)("%s — the trial record has to be contested before, not after", async (locale) => {
    const dict = await getDictionary(locale);
    const { warningTrial } = dict.deleteAccount.selfService.step3;

    expect(warningTrial.length, `${locale}: selfService.step3.warningTrial is empty`).toBeGreaterThan(60);
  });

  it.each(locales)("%s — the tester list is named, and named as manual", async (locale) => {
    const dict = await getDictionary(locale);

    expect(
      dict.deleteAccount.selfService.step3.warningTesters,
      `${locale}: selfService.step3.warningTesters never names the Play Console`,
    ).toContain("Google Play");
  });

  it.each(locales)("%s — the retention of the two hashes is still disclosed", async (locale) => {
    const dict = await getDictionary(locale);
    const [ledger] = dict.deleteAccount.whatRemains.items;

    // The retention period, the one number in that paragraph that is a promise.
    expect(ledger, `${locale}: whatRemains ledger item omits the 12-month retention`).toContain("12");
  });

  it.each(locales)("%s — both timings are stated, because both paths still exist", async (locale) => {
    const dict = await getDictionary(locale);

    expect(dict.deleteAccount.timing.body, `${locale}: timing.body omits the manual deadline`).toContain(DEADLINE);
  });
});

describe("the self-service copy is complete in every locale", () => {
  // A missing string here type-checks: `tsc` proves the key exists, never that
  // a translator filled it. An empty step title is a page that asks someone to
  // destroy their data under a blank heading.
  it.each(locales)("%s", async (locale) => {
    const dict = await getDictionary(locale);

    for (const [path, value] of Object.entries(flatten(dict.deleteAccount.selfService, "selfService"))) {
      expect(value.trim().length, `${locale}: ${path} is empty`).toBeGreaterThan(0);
    }
  });
});

/** Every string in a nested copy object, addressed by its dotted path. */
function flatten(node: object, path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(node)) {
    if (typeof value === "string") out[`${path}.${key}`] = value;
    else if (value && typeof value === "object") Object.assign(out, flatten(value, `${path}.${key}`));
  }
  return out;
}

describe("the contact address is one address, not one per locale", () => {
  // It was hardcoded in the component until phase 2 — a user-visible string in
  // the markup, which the spec's boundaries forbid.
  it.each(locales)("%s", async (locale) => {
    const dict = await getDictionary(locale);

    expect(dict.deleteAccount.contact.email).toBe("privacy@eatease.eu");
  });
});
