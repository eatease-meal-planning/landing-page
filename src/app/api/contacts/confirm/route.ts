import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isValidLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { escapeHtml, renderEmail } from "@/lib/email";
import { getResend } from "@/lib/resend";

/**
 * Double opt-in confirmation — and, since the closed test, the moment a signup
 * becomes a tester.
 *
 * Confirming does not grant access: the address still has to be added by hand
 * to the closed-test list in the Play Console. The email to the operator is
 * what carries that instruction, so it is the send that must succeed, and the
 * row is only marked once Resend has accepted it. Before this, both emails went
 * out through a `Promise.all` whose result was never inspected, after the row
 * had already been written — and `resend.emails.send()` resolves
 * `{ data, error }` rather than rejecting. A failed send therefore left a
 * confirmed row, an empty operator inbox and a visitor on the success page,
 * with the second click short-circuiting on `contact.confirmed` and never
 * resending.
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
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const welcomeFrom = process.env.RESEND_WELCOME_EMAIL;
  // The operator inbox has its own variable, mirroring
  // DELETION_REQUEST_TO_EMAIL. It used to be RESEND_WELCOME_EMAIL, which was
  // simultaneously the *sender* of the visitor's welcome email — one address
  // doing two unrelated jobs. The fallback keeps existing deployments working
  // until the variable is set; the warning says it is happening.
  const operator = process.env.SIGNUP_NOTIFICATION_TO_EMAIL ?? welcomeFrom;
  if (!operator) {
    console.warn("[confirm] SIGNUP_NOTIFICATION_TO_EMAIL is not set");
  } else if (!process.env.SIGNUP_NOTIFICATION_TO_EMAIL) {
    console.warn("[confirm] SIGNUP_NOTIFICATION_TO_EMAIL is not set — falling back to RESEND_WELCOME_EMAIL");
  }
  if (!resend || !fromEmail || !welcomeFrom || !operator) {
    console.error("[confirm] RESEND_API_KEY / RESEND_FROM_EMAIL / RESEND_WELCOME_EMAIL is not set — refusing to confirm");
    return errorRedirect(req, "en", "CONFIG_MISSING_RESEND");
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

  // 1. The operator notification. This is the one that grants access, so it
  //    runs first and its failure stops everything: an unconfirmed row with a
  //    token still valid for 48h is a link the visitor can simply click again.
  const notificationHtml = renderEmail("new-user-confirmation.html", {
    user_name:    contact.name,
    user_email:   contact.email,
    confirmed_at: confirmedAt.toUTCString(),
    site_url:     siteUrl,
  }, ["user_name", "user_email"]);

  try {
    const { error } = await resend.emails.send({
      from:    `Eatease <${fromEmail}>`,
      to:      operator,
      replyTo: contact.email,
      subject: `[Closed test] Add ${contact.email} to the tester list`,
      html:    notificationHtml,
    });
    if (error) {
      console.error("[confirm] Resend rejected the operator notification:", error);
      return errorRedirect(req, locale, `SIGNUP_NOTIFICATION_FAILED:${error.name}`);
    }
  } catch (err) {
    console.error("[confirm] operator notification threw:", err);
    return errorRedirect(req, locale, "SIGNUP_NOTIFICATION_FAILED:threw");
  }

  // 2. Only now is the signup safe to record. A failure here has already cost
  //    the operator a notification; clicking again sends a second one, which is
  //    visible and recoverable, unlike the silent loss this ordering replaces.
  try {
    await db
      .update(contacts)
      .set({ confirmed: true, confirmedAt })
      .where(eq(contacts.token, token));
  } catch (err) {
    console.error("[confirm] marking the contact confirmed failed:", err);
    return errorRedirect(req, locale, "DB_UNAVAILABLE");
  }

  // 3. The welcome email is best-effort. The signup IS recorded, so an error
  //    page here would tell the visitor something untrue.
  const dict = await getDictionary(locale);
  const emailT = dict.emails.welcome;
  try {
    const welcomeHtml = renderEmail("welcome-email.html", {
      subject:  emailT.subject,
      greeting: emailT.greeting.replace("{name}", escapeHtml(contact.name)),
      body:     emailT.body,
      sign_off: emailT.signOff,
      team:     dict.emails.teamName,
      site_url: siteUrl,
    });
    const { error } = await resend.emails.send({
      from:    `Ricardo Rato · Eatease <${welcomeFrom}>`,
      to:      contact.email,
      subject: emailT.subject,
      html:    welcomeHtml,
    });
    if (error) console.error("[confirm] Resend rejected the welcome email:", error);
  } catch (err) {
    console.error("[confirm] welcome email threw:", err);
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
