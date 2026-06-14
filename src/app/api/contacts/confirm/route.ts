import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { detectLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const locale = detectLocale(req.headers.get("accept-language"));
  const dict   = await getDictionary(locale);
  const emailT = dict.emails.welcome;

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.redirect(new URL(`/${locale}/error`, req.url));

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.token, token),
  });

  if (!contact) return NextResponse.redirect(new URL(`/${locale}/error`, req.url));
  if (contact.confirmed) return NextResponse.redirect(new URL(`/${locale}/confirmed`, req.url));
  if (contact.tokenExpiresAt < new Date()) {
    return NextResponse.redirect(new URL(`/${locale}/link-expired`, req.url));
  }

  await db
    .update(contacts)
    .set({ confirmed: true, confirmedAt: new Date() })
    .where(eq(contacts.token, token));

  const greeting = emailT.greeting.replace("{name}", contact.name);

  await resend.emails.send({
    from:    "EatEase <noreply@eatease.eu>",
    to:      contact.email,
    subject: emailT.subject,
    html:    `<p>${greeting}</p><p>${emailT.body}</p>`,
  });

  return NextResponse.redirect(new URL(`/${locale}/confirmed`, req.url));
}
