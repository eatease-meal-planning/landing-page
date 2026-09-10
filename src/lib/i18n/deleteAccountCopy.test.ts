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
 * The statutory deadline stated on the page and in the email. Phase 1 processes
 * requests by hand, so 30 days (GDPR art. 12(3)) is what is promised.
 * TASK-14 replaces this with immediate deletion, in all ten locales at once —
 * that task updates this constant, and the assertions below keep holding.
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
