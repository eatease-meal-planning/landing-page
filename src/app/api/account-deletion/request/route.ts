import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { isValidLocale } from "@/lib/i18n/config";
import { appSupabaseServer, isAppSupabaseConfigured } from "@/lib/appSupabase";
import { deletionPageUrl } from "@/lib/deletionPageUrl";
import { runRequestGuards } from "@/lib/apiGuards";

const schema = z.object({
  email:            z.string().email(),
  locale:           z.string().optional(),
  cfTurnstileToken: z.string().min(1),
});

/**
 * Step 1 of self-service deletion: ask the app's Supabase project to email a
 * six-digit code. The browser exchanges it for the user's own JWT, and that
 * token — never a credential of ours — is what authorises the deletion.
 *
 * **The answer is the same whether or not the account exists.** Both the body
 * and the latency: `shouldCreateUser: false` makes Supabase reject an unknown
 * address quickly, while a real send takes visibly longer, so awaiting the call
 * would publish the difference as response time. The request is handed to
 * `after()` instead, which runs it once the response is out.
 *
 * `after()` rather than a bare floating promise: on serverless the function can
 * be torn down the moment it answers, and a detached `.catch()` would then drop
 * the email intermittently — with the caller already told everything was fine.
 *
 * **What the Turnstile check here does and does not buy.** It does not protect
 * Supabase's OTP endpoint: anyone can call `/auth/v1/otp` on the app project
 * directly with the key the APK ships. It protects this page and our sending
 * reputation, and gives the constant answer somewhere to live. The real
 * backstop is Supabase's own auth rate limiting.
 */
export async function POST(req: NextRequest) {
  const guarded = await runRequestGuards(req, {
    name:            "account-deletion/request",
    rateLimitPrefix: "del",
    schema,
    configChecks:    [() => (isAppSupabaseConfigured() ? null : "CONFIG_MISSING_APP_SUPABASE")],
  });
  if (!guarded.ok) return guarded.response;

  const { email, locale: rawLocale } = guarded.data;
  const locale = rawLocale && isValidLocale(rawLocale) ? rawLocale : ("en" as const);

  after(async () => {
    const supabase = appSupabaseServer();
    if (!supabase) return; // Already reported by the configuration check above.

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Asking to be deleted must never create the account being deleted.
          shouldCreateUser: false,
          // Not a destination — nothing in this email is clickable. It reaches
          // the Supabase template as {{ .RedirectTo }}, which is the only
          // signal there for choosing a language.
          emailRedirectTo: deletionPageUrl(locale),
        },
      });
      // Expected for an address with no account, and not an error on our side:
      // logged at info so a genuinely broken configuration is still visible in
      // the logs, without an alert for every stranger who tries the form.
      if (error) console.info("[account-deletion/request] no code sent:", error.message);
    } catch (err) {
      console.error("[account-deletion/request] OTP request threw:", err);
    }
  });

  // Deliberately identical in both cases, and worded that way on the page: if
  // an account exists for this address, a code is on its way.
  return NextResponse.json({ ok: true }, { status: 200 });
}
