import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isValidLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { escapeHtml, renderEmail } from "@/lib/email";
import { fail } from "@/lib/apiError";
import { getResend } from "@/lib/resend";
import { getClientIp, verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rateLimit";

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

  // Configuration is checked before anything else: it costs nothing, it is the
  // failure a fresh deploy is most likely to hit, and putting it first makes it
  // reachable with a plain curl instead of a valid Turnstile token.
  const operator = process.env.DELETION_REQUEST_TO_EMAIL;
  if (!operator) {
    console.error("[account-deletion] DELETION_REQUEST_TO_EMAIL is not set — refusing requests");
    return fail(503, "CONFIG_MISSING_OPERATOR");
  }
  // getResend() returns null rather than throwing: `new Resend(undefined)`
  // throws, so building the client at module scope would kill this route on
  // import and this branch would never run.
  const resend = getResend();
  if (!resend || !process.env.RESEND_FROM_EMAIL) {
    console.error("[account-deletion] RESEND_API_KEY / RESEND_FROM_EMAIL is not set — refusing requests");
    return fail(503, "CONFIG_MISSING_RESEND");
  }

  // Prefixed key: deletion requests get their own budget, so hammering this
  // endpoint can't lock the waitlist form for the same visitor.
  let limited: boolean;
  try {
    limited = await checkRateLimit(`del:${ip}`);
  } catch (err) {
    // A cold or paused database used to surface as an empty-body 500 that told
    // nobody anything — on a page where a dropped erasure request is a
    // compliance failure.
    console.error("[account-deletion] rate limit check failed:", err);
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

  const { email, reason, cfTurnstileToken } = parsed.data;

  const captcha = await verifyTurnstile(cfTurnstileToken, ip);
  if (!captcha.ok) {
    // Cloudflare's code names the cause: invalid-input-secret (site key and
    // secret are from different widgets), timeout-or-duplicate (token expired
    // or replayed), missing-secret-env, ...
    return fail(400, `CAPTCHA_FAILED:${captcha.codes.join(",") || "unknown"}`);
  }

  const rawLocale = parsed.data.locale ?? "en";
  const locale = isValidLocale(rawLocale) ? rawLocale : ("en" as const);
  const dict = await getDictionary(locale);
  const emailT = dict.emails.deletionRequest;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const from    = `Eatease <${process.env.RESEND_FROM_EMAIL}>`;

  // Forwarding to the operator IS the deletion mechanism, so this send is the
  // one that must succeed.
  //
  // It has to be checked two ways. `resend.emails.send()` does NOT reject: the
  // SDK resolves to `{ data, error }` for an API rejection (unverified domain,
  // revoked key, 429) *and* for a transport failure. A bare try/catch around it
  // therefore never fires, and the route would answer 202 "request received"
  // with nothing in the operator's inbox — the exact silent failure this page
  // cannot afford. The try/catch stays for what genuinely throws.
  try {
    const { error } = await resend.emails.send({
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

    if (error) {
      console.error("[account-deletion] Resend rejected the operator notification:", error);
      return fail(502, `OPERATOR_MAIL_FAILED:${error.name}`);
    }
  } catch (err) {
    console.error("[account-deletion] operator notification threw:", err);
    return fail(500, "OPERATOR_MAIL_FAILED:threw");
  }

  // From here the request is safely recorded with the operator. The
  // acknowledgement is best-effort: a failure here must not tell the user their
  // request was lost, because it wasn't.
  try {
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
    // replyTo is the operator, not the sender: RESEND_FROM_EMAIL is a no-reply
    // address, and this message asks the recipient to reply in order to cancel
    // a request they did not make. Without it that instruction is as false as
    // the "just ignore it" it replaces.
    const { error } = await resend.emails.send({ from, to: email, replyTo: operator, subject: emailT.subject, html });
    if (error) console.error("[account-deletion] Resend rejected the acknowledgement:", error);
  } catch (err) {
    console.error("[account-deletion] acknowledgement email threw:", err);
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
