import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { renderEmail } from "@/lib/email";
import { getClientIp, verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);

const schema = z.object({
  email:            z.string().email(),
  reason:           z.string().max(1000).optional(),
  locale:           z.string().optional(),
  cfTurnstileToken: z.string().min(1),
});

/**
 * Account deletion request (the URL published to the Google Play Console).
 *
 * Phase 1 is request-and-process: we record nothing in the database and take no
 * destructive action here. The request is emailed to the operator, who verifies
 * identity before deleting anything — which is also why the acknowledgement
 * email tells the recipient to reply if the request wasn't theirs.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Prefixed key: deletion requests get their own budget, so hammering this
  // endpoint can't lock the waitlist form for the same visitor.
  const limited = await checkRateLimit(`del:${ip}`);
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

  const { email, reason, cfTurnstileToken } = parsed.data;

  const captchaOk = await verifyTurnstile(cfTurnstileToken, ip);
  if (!captchaOk) {
    return NextResponse.json({ error: "Security check failed." }, { status: 400 });
  }

  const rawLocale = parsed.data.locale ?? "en";
  const locale = isValidLocale(rawLocale) ? rawLocale : ("en" as const);
  const dict = await getDictionary(locale);
  const emailT = dict.emails.deletionRequest;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const from    = `Eatease <${process.env.RESEND_FROM_EMAIL}>`;
  const operator = process.env.DELETION_REQUEST_TO_EMAIL;

  // Forwarding to the operator IS the deletion mechanism. Without it there is
  // nothing to acknowledge, so fail loudly rather than return 202 and drop an
  // erasure request on the floor — a silent success here is the worst outcome:
  // the page looks healthy to Google and to the user while nothing happens.
  if (!operator) {
    console.error("[account-deletion] DELETION_REQUEST_TO_EMAIL is not set — refusing to accept requests");
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  // Must go out even if the acknowledgement to the requester fails.
  await resend.emails.send({
    from,
    to:      operator,
    replyTo: email,
    subject: `[Account deletion] ${email}`,
    html: [
      `<p><strong>Account deletion requested</strong></p>`,
      `<p>Email: <code>${escapeHtml(email)}</code><br/>`,
      `Locale: ${locale}<br/>`,
      `Requested at: ${new Date().toISOString()}<br/>`,
      `IP: ${escapeHtml(ip)}</p>`,
      reason ? `<p>Reason:<br/>${escapeHtml(reason).replace(/\n/g, "<br/>")}</p>` : "",
      `<p>Verify the requester controls this address before deleting. Delete the`,
      ` Supabase auth user (cascades every owned row + storage) and the matching`,
      ` <code>contacts</code> row on the landing page. The trial_ledger row is`,
      ` retained by design — remove it only on an article 21 objection.</p>`,
    ].join(""),
  });

  const html = renderEmail("deletion-request.html", {
    subject:  emailT.subject,
    greeting: emailT.greeting,
    intro:    emailT.intro,
    body:     emailT.body,
    ignore:   emailT.ignore,
    sign_off: emailT.signOff,
    team:     dict.emails.teamName,
    site_url: siteUrl,
  });

  try {
    await resend.emails.send({ from, to: email, subject: emailT.subject, html });
  } catch (err) {
    // The operator already has the request; a bounced acknowledgement must not
    // make the user think their request failed.
    console.error("[account-deletion] acknowledgement email failed:", err);
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
