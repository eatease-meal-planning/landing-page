import type { Locale } from "@/lib/i18n/config";

/**
 * The canonical origin, deliberately not `NEXT_PUBLIC_SITE_URL`.
 *
 * This URL is never followed by anyone. The deletion email carries a six-digit
 * code and no link at all — the URL travels only as `emailRedirectTo`, so that
 * it reaches the Supabase template as `{{ .RedirectTo }}`, where it is the one
 * signal available for choosing the language (Supabase keeps one template per
 * project, with no language variants).
 *
 * Being a language carrier rather than a destination is what makes a constant
 * correct here: a request from localhost has to produce the same localized
 * email as production, and the app project's Redirect URL allow-list then holds
 * exactly these ten URLs instead of one set per environment.
 */
export const DELETION_PAGE_ORIGIN = "https://www.eatease.eu";

/**
 * The deletion page for one locale.
 *
 * `src/templates/deletion-code.html` branches on the exact strings this
 * returns. If the two ever disagree, Supabase matches nothing, falls back to
 * the Site URL, and every language renders in English — with no error anywhere.
 * That is why both sides derive from here, and why the template's test asserts
 * against this function rather than against a copy of the string.
 */
export function deletionPageUrl(locale: Locale): string {
  return `${DELETION_PAGE_ORIGIN}/${locale}/delete-account`;
}
