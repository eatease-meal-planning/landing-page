import { describe, expect, it } from "vitest";
import { locales } from "./i18n/config";
import { renderInvite, type LocaleEmails } from "./closedTestInvite";
import { renderEmail } from "./email";

/**
 * Guards the gap `tsc` cannot see.
 *
 * `LocaleEmails` is a hand-written structural type, and the send script reaches
 * the real dictionaries through an untyped dynamic `import()` from a `.mjs`
 * file. Nothing in the type system ever compares the two — which is how
 * `ctaDownload` and `downloadNote` got added to the `welcome` block instead of
 * `closedTestInvite`, compiled clean, and rendered the literal string
 * "undefined" into a live email.
 */
const required = [
  "subject",
  "greeting",
  "intro",
  "instructionsTitle",
  "step1",
  "step2",
  "cta",
  "ctaDownload",
  "downloadNote",
  "fallbackNote",
  "feedbackNote",
  "signOff",
] as const;

describe("every locale can render the closed-test invite", () => {
  it.each(locales)("%s", async (locale) => {
    const mod = await import(`./i18n/locales/${locale}/emails`);
    const emails = mod.emails as LocaleEmails;

    for (const key of required) {
      const value = emails.closedTestInvite?.[key];
      expect(value, `${locale}: emails.closedTestInvite.${key}`).toBeTypeOf("string");
      expect((value as string).trim(), `${locale}: emails.closedTestInvite.${key} is empty`).not.toBe("");
    }

    expect(emails.teamName, `${locale}: emails.teamName`).toBeTypeOf("string");
    expect(emails.privacyPolicy, `${locale}: emails.privacyPolicy`).toBeTypeOf("string");

    const { subject, html } = renderInvite({
      emails,
      recipient: { email: "a@b.com", name: "Ricardo", locale },
      optInUrl: "https://play.google.com/apps/testing/com.eatease.app",
      downloadUrl: "https://play.google.com/store/apps/details?id=com.eatease.app",
      siteUrl: "https://eatease.eu",
      renderTemplate: renderEmail,
    });

    expect(subject.trim()).not.toBe("");
    // The three symptoms of a key that resolved to nothing.
    expect(html, `${locale}: unresolved placeholder`).not.toContain("{{");
    expect(html, `${locale}: undefined rendered into the body`).not.toContain("undefined");
    expect(html).toContain("apps/testing/com.eatease.app");
    expect(html).toContain("store/apps/details?id=com.eatease.app");
  });
});
