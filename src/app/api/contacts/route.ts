import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, rateLimits } from "@/db/schema";
import { Resend } from "resend";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { renderEmail } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const EMAIL_COOLDOWN    = 60 * 60 * 1000;

const schema = z.object({
  name:              z.string().min(2).max(50),
  email:             z.string().email(),
  locale:            z.string().optional(),
  cfTurnstileToken:  z.string().min(1),
});

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    const secret = (process.env.TURNSTILE_SECRET_KEY ?? "").trim();
    console.log("[Turnstile] secret length:", secret.length, "| starts:", secret.slice(0, 4), "| ends:", secret.slice(-4));
    const body = new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    });
    const res  = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    });
    const data = await res.json() as { success: boolean; "error-codes"?: string[] };
    if (!data.success) console.error("[Turnstile] verification failed:", data["error-codes"]);
    return data.success === true;
  } catch (err) {
    console.error("[Turnstile] fetch error:", err);
    return false;
  }
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

async function checkIpRateLimit(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);

  const [row] = await db
    .insert(rateLimits)
    .values({ ip, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: rateLimits.ip,
      set: {
        count: sql`CASE
          WHEN rate_limits.window_start > ${windowStart.toISOString()}
          THEN rate_limits.count + 1
          ELSE 1
        END`,
        windowStart: sql`CASE
          WHEN rate_limits.window_start > ${windowStart.toISOString()}
          THEN rate_limits.window_start
          ELSE now()
        END`,
      },
    })
    .returning();

  return (row?.count ?? 0) > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const limited = await checkIpRateLimit(ip);
  if (limited) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const { name, email, cfTurnstileToken } = parsed.data;

  const captchaOk = await verifyTurnstile(cfTurnstileToken, ip);
  if (!captchaOk) {
    return NextResponse.json({ error: "Security check failed." }, { status: 400 });
  }

  const rawLocale = parsed.data.locale ?? "en";
  const locale = isValidLocale(rawLocale) ? rawLocale : ("en" as const);
  const dict = await getDictionary(locale);
  const emailT = dict.emails.confirmation;

  const existing = await db.query.contacts.findFirst({
    where: eq(contacts.email, email),
  });

  if (existing?.confirmed) {
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  }

  if (existing && !existing.confirmed) {
    const cooldownUntil = new Date(Date.now() - EMAIL_COOLDOWN);
    const lastSentAt = new Date(existing.tokenExpiresAt.getTime() - 48 * 60 * 60 * 1000);
    if (lastSentAt > cooldownUntil) {
      return NextResponse.json(
        { error: "Confirmation email already sent. Check your inbox (including spam)." },
        { status: 429 }
      );
    }
  }

  const [contact] = await db
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

  await resend.emails.send({
    from:    `Eatease <${process.env.RESEND_FROM_EMAIL}>`,
    to:      email,
    subject: emailT.subject,
    html,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
