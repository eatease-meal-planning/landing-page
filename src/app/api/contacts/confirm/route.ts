import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { renderEmail } from "@/lib/email";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  // Sem token: ainda não temos o contacto, usamos "en" como fallback.
  if (!token) return NextResponse.redirect(new URL("/en/error", req.url));

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.token, token),
  });

  // A partir daqui já temos (ou não) o contacto.
  // Se não existir, também não temos locale — fallback para "en".
  if (!contact) return NextResponse.redirect(new URL("/en/error", req.url));

  // Locale guardado na BD no momento da submissão do formulário.
  // isValidLocale protege contra valores inválidos que possam estar na BD.
  const locale = isValidLocale(contact.locale) ? contact.locale : "en";

  if (contact.confirmed) {
    return NextResponse.redirect(new URL(`/${locale}/confirmed`, req.url));
  }

  if (contact.tokenExpiresAt < new Date()) {
    return NextResponse.redirect(new URL(`/${locale}/link-expired`, req.url));
  }

  // Token válido — confirmar e enviar emails no locale do contacto.
  const confirmedAt = new Date();

  await db
    .update(contacts)
    .set({ confirmed: true, confirmedAt })
    .where(eq(contacts.token, token));

  const dict   = await getDictionary(locale);
  const emailT = dict.emails.welcome;

  const siteUrl      = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const fromEmail    = process.env.RESEND_FROM_EMAIL ?? "";
  const welcomeEmail = process.env.RESEND_WELCOME_EMAIL ?? "";
  const greeting     = emailT.greeting.replace("{name}", contact.name);

  const welcomeHtml = renderEmail("welcome-email.html", {
    subject:  emailT.subject,
    greeting: greeting,
    body:     emailT.body,
    sign_off: emailT.signOff,
    team:     dict.emails.teamName,
    site_url: siteUrl,
  });

  const notificationHtml = renderEmail("new-user-confirmation.html", {
    user_name:    contact.name,
    user_email:   contact.email,
    confirmed_at: confirmedAt.toUTCString(),
    site_url:     siteUrl,
  }, ["user_name", "user_email"]);

  await Promise.all([
    resend.emails.send({
      from:    `Ricardo Rato · Eatease <${welcomeEmail}>`,
      to:      contact.email,
      subject: emailT.subject,
      html:    welcomeHtml,
    }),
    resend.emails.send({
      from:    `Eatease <${fromEmail}>`,
      to:      welcomeEmail,
      subject: `New signup: ${contact.name}`,
      html:    notificationHtml,
    }),
  ]);

  return NextResponse.redirect(new URL(`/${locale}/confirmed`, req.url));
}
