import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { renderEmail } from "@/lib/email";
import { fail } from "@/lib/apiError";
import { getResend } from "@/lib/resend";
import { getClientIp, verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rateLimit";

const EMAIL_COOLDOWN = 60 * 60 * 1000;

const schema = z.object({
  name:              z.string().min(2).max(50),
  email:             z.string().email(),
  locale:            z.string().optional(),
  cfTurnstileToken:  z.string().min(1),
});

/**
 * Closed-test signup (formerly the waitlist).
 *
 * Every failure carries a stable code the UI shows and support can grep. This
 * form answered 201 for weeks while sending nothing — a wrong Turnstile secret
 * reported by the server and dropped by the UI — and the cost of that silence
 * was two blind debugging sessions and an empty list.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Configuration first: it costs nothing, it is what a fresh deploy is most
  // likely to get wrong, and putting it ahead of the captcha makes it
  // reachable with a plain curl.
  const resend = getResend();
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.error("[contacts] RESEND_API_KEY / RESEND_FROM_EMAIL is not set — refusing signups");
    return fail(503, "CONFIG_MISSING_RESEND");
  }

  let limited: boolean;
  try {
    limited = await checkRateLimit(`wl:${ip}`);
  } catch (err) {
    // The Supabase project sleeps; the first query after that used to surface
    // as an empty-body 500 that told nobody anything.
    console.error("[contacts] rate limit check failed:", err);
    return fail(503, "DB_UNAVAILABLE");
  }
  if (limited) {
    return fail(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes and try again.");
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "INVALID_DATA");
  }

  const { name, email, cfTurnstileToken } = parsed.data;

  const captcha = await verifyTurnstile(cfTurnstileToken, ip);
  if (!captcha.ok) {
    return fail(400, `CAPTCHA_FAILED:${captcha.codes.join(",") || "unknown"}`);
  }

  const rawLocale = parsed.data.locale ?? "en";
  const locale = isValidLocale(rawLocale) ? rawLocale : ("en" as const);
  const dict = await getDictionary(locale);
  const emailT = dict.emails.confirmation;

  let contact: typeof contacts.$inferSelect;
  try {
    const existing = await db.query.contacts.findFirst({
      where: eq(contacts.email, email),
    });

    if (existing?.confirmed) {
      return fail(409, "ALREADY_REGISTERED", "Email already registered.");
    }

    if (existing && !existing.confirmed) {
      const cooldownUntil = new Date(Date.now() - EMAIL_COOLDOWN);
      const lastSentAt = new Date(existing.tokenExpiresAt.getTime() - 48 * 60 * 60 * 1000);
      if (lastSentAt > cooldownUntil) {
        return fail(429, "COOLDOWN_ACTIVE", "Confirmation email already sent. Check your inbox (including spam).");
      }
    }

    [contact] = await db
      .insert(contacts)
      .values({ name, email, locale })
      .onConflictDoUpdate({
        target: contacts.email,
        set: {
          name,
          token:          sql`gen_random_uuid()`,
          tokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          confirmed:      false,
          locale,
        },
      })
      .returning();
  } catch (err) {
    console.error("[contacts] contact upsert failed:", err);
    return fail(503, "DB_UNAVAILABLE");
  }

  const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const confirmUrl = `${siteUrl}/api/contacts/confirm?token=${contact.token}`;
  const greeting   = emailT.greeting.replace("{name}", name);

  const html = renderEmail("confirmation-email.html", {
    subject:      emailT.subject,
    greeting:     greeting,
    intro:        emailT.intro,
    cta_label:    emailT.cta,
    confirm_url:  confirmUrl,
    expires_note: emailT.expiresNote,
    sign_off:     emailT.signOff,
    team:         dict.emails.teamName,
    site_url:     siteUrl,
  }, ["greeting"]);

  // The SDK does not reject: it resolves `{ data, error }` for an API
  // rejection and for a transport failure alike. Answering 201 without
  // checking would promise a confirmation link that was never sent.
  const { error } = await resend.emails.send({
    from:    `Eatease <${process.env.RESEND_FROM_EMAIL}>`,
    to:      email,
    subject: emailT.subject,
    html,
  });

  if (error) {
    console.error("[contacts] Resend rejected the confirmation email:", error);
    return fail(502, `MAIL_FAILED:${error.name}`);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
