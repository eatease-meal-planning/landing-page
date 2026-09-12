import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { locales, defaultLocale, type Locale } from "./config";
import { deletionPageUrl } from "@/lib/deletionPageUrl";

/**
 * `src/templates/deletion-code.html` is pasted into the Supabase Dashboard and
 * rendered there by Go templates, so nothing in the build ever type-checks it.
 * Its language is chosen by matching `{{ .RedirectTo }}` against the URL that
 * `/api/account-deletion/request` passes as `emailRedirectTo`.
 *
 * That match is exact and silent: a locale missing from the template, a typo in
 * one URL, or a locale added to `config.ts` and forgotten here all produce a
 * perfectly valid email — in English, to someone who asked for it in Polish.
 * These assertions are the only place that drift can be caught.
 */
const template = fs.readFileSync(
  path.join(process.cwd(), "src", "templates", "deletion-code.html"),
  "utf-8",
);

/** Everything the template must say, in every language. */
const STRINGS = ["$heading", "$intro", "$codeLabel", "$expiry", "$notYou", "$signOff", "$team"];

/** The `{{ if eq .RedirectTo "…" }}…{{ end }}` block for one locale. */
function localeBlock(locale: Locale): string {
  const opening = `{{ if eq .RedirectTo "${deletionPageUrl(locale)}" }}`;
  const start = template.indexOf(opening);
  if (start === -1) return "";
  const end = template.indexOf("{{ end }}", start);
  return template.slice(start + opening.length, end);
}

const translated = locales.filter((l) => l !== defaultLocale);

describe("deletion-code.html — locale selection", () => {
  it.each(translated)("branches on the %s deletion URL", (locale) => {
    expect(template).toContain(`{{ if eq .RedirectTo "${deletionPageUrl(locale)}" }}`);
  });

  it.each(translated)("assigns every string in the %s branch", (locale) => {
    const block = localeBlock(locale);
    for (const name of STRINGS) {
      expect(block, `${locale} is missing ${name}`).toContain(`{{ ${name} = `);
    }
  });

  it("declares every string as the English default, which is what an unmatched URL falls back to", () => {
    // Supabase falls back to the Site URL when emailRedirectTo is not in the
    // allow-list, so the default branch is a live code path, not a formality.
    for (const name of STRINGS) {
      expect(template).toContain(`{{ ${name} := `);
    }
  });

  it("has no branch for a locale this site does not serve", () => {
    const branched = [...template.matchAll(/\{\{ if eq \.RedirectTo "([^"]+)" \}\}/g)].map((m) => m[1]);

    expect(branched).toEqual(translated.map(deletionPageUrl));
  });
});

describe("deletion-code.html — what the email carries", () => {
  it("sends the 6-digit code and not a confirmation link", () => {
    // The whole reason this flow uses a code: a link is consumed by corporate
    // scanners before the recipient clicks, and needs a Redirect URL allow-list
    // entry per locale to be safe to follow.
    expect(template).toContain("{{ .Token }}");
    expect(template).not.toContain("{{ .ConfirmationURL }}");
  });

  it("uses no renderEmail() placeholder, so the two template engines cannot mix", () => {
    // renderEmail() replaces `{{{key}}}` and `{{ key }}`; Supabase's variables
    // are dot-prefixed. A file carrying both would be rendered twice, by two
    // engines with different escaping rules.
    expect(template).not.toMatch(/\{\{\{[^}]+\}\}\}/);
  });
});
