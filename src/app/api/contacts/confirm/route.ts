import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { renderEmail } from "@/lib/email";
import { renderInvite } from "@/lib/closedTestInvite";
import { getResend } from "@/lib/resend";

/**
 * Double opt-in confirmation — and the moment a signup receives its invite.
 *
 * The test is open, so confirming needs no manual step in the Play Console:
 * the one email sent here carries both links, opt-in first and download
 * second, and the row is only marked once Resend has accepted it.
 * `resend.emails.send()` resolves `{ data, error }` rather than rejecting, so
 * a failed send used to leave a confirmed row and a visitor on the success
 * page with nothing in their inbox — and the second click short-circuits on
 * `contact.confirmed`, so it never resent. Sending first and marking after
 * keeps the token (valid 48h) usable as the retry.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  // No token: we have no contact yet, so no locale either.
  if (!token) return errorRedirect(req, "en", "NO_TOKEN");

  // Configuration is checked before the database is touched. getResend()
  // returns null rather than throwing: `new Resend(undefined)` throws, so
  // building the client at module scope took the whole route down on import
  // and every confirmation link answered 500 with nothing to quote.
  const resend = getResend();
  // Not RESEND_FROM_EMAIL: that is a no-reply, and the invite asks for replies.
  const fromEmail = process.env.CLOSED_TEST_FROM_EMAIL;
  if (!resend || !fromEmail) {
    console.error("[confirm] RESEND_API_KEY / CLOSED_TEST_FROM_EMAIL is not set — refusing to confirm");
    return errorRedirect(req, "en", "CONFIG_MISSING_RESEND");
  }

  // Without both links the email would promise a step it cannot deliver.
  const optInUrl = process.env.CLOSED_TEST_OPT_IN_URL;
  const downloadUrl = process.env.CLOSED_TEST_DOWNLOAD_URL;
  if (!optInUrl || !downloadUrl) {
    console.error("[confirm] CLOSED_TEST_OPT_IN_URL / CLOSED_TEST_DOWNLOAD_URL is not set — refusing to confirm");
    return errorRedirect(req, "en", "CONFIG_MISSING_TEST_LINKS");
  }

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.token, token),
  });

  // No contact means no locale either.
  if (!contact) return errorRedirect(req, "en", "UNKNOWN_TOKEN");

  // Locale recorded when the form was submitted. isValidLocale guards against
  // whatever may be sitting in the column.
  const locale = isValidLocale(contact.locale) ? contact.locale : "en";

  if (contact.confirmed) {
    return NextResponse.redirect(new URL(`/${locale}/confirmed`, req.url));
  }

  if (contact.tokenExpiresAt < new Date()) {
    return NextResponse.redirect(new URL(`/${locale}/link-expired`, req.url));
  }

  const confirmedAt = new Date();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // 1. The invite. Its failure stops everything: an unconfirmed row with a
  //    token still valid for 48h is a link the visitor can simply click again.
  const { emails } = await getDictionary(locale);
  const { subject, html } = renderInvite({
    emails,
    recipient: { email: contact.email, name: contact.name, locale },
    optInUrl,
    downloadUrl,
    siteUrl,
    renderTemplate: renderEmail,
  });

  try {
    const { error } = await resend.emails.send({
      from: `Ricardo Rato · Eatease <${fromEmail}>`,
      to:   contact.email,
      subject,
      html,
    });
    if (error) {
      console.error("[confirm] Resend rejected the invite:", error);
      return errorRedirect(req, locale, `INVITE_FAILED:${error.name}`);
    }
  } catch (err) {
    console.error("[confirm] invite threw:", err);
    return errorRedirect(req, locale, "INVITE_FAILED:threw");
  }

  // 2. Only now is the signup safe to record. A failure here has already cost
  //    the visitor an email; clicking again sends a second one, which is
  //    visible and recoverable, unlike the silent loss this ordering replaces.
  try {
    await db
      .update(contacts)
      .set({ confirmed: true, confirmedAt, closedTestInvitedAt: confirmedAt })
      .where(eq(contacts.token, token));
  } catch (err) {
    console.error("[confirm] marking the contact confirmed failed:", err);
    return errorRedirect(req, locale, "DB_UNAVAILABLE");
  }

  return NextResponse.redirect(new URL(`/${locale}/confirmed`, req.url));
}

/**
 * The error page carries the code in the query string. A confirmation link that
 * fails is a tester lost in silence otherwise — there is no form to re-submit
 * and no response body for anyone to read.
 */
function errorRedirect(req: NextRequest, locale: Locale, code: string) {
  const url = new URL(`/${locale}/error`, req.url);
  url.searchParams.set("code", code);
  return NextResponse.redirect(url);
}
