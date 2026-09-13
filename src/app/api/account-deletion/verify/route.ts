import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fail } from "@/lib/apiError";
import { appSupabaseServer, isAppSupabaseConfigured } from "@/lib/appSupabase";

const schema = z.object({
  email: z.string().email(),
  code:  z.string().regex(/^\d{6}$/),
});

/**
 * Step 2: exchange the emailed six-digit code for the caller's own JWT.
 *
 * **Why this is a route handler and not a call from the browser.** Doing it in
 * the browser needs the app project's URL and anon key in the client bundle.
 * That key is public by design — the APK ships it, and the app project's RLS is
 * the boundary — but it is still a credential-shaped string, and a page about
 * data protection should not be the one serving it. Nothing is lost: the token
 * this hands back belongs to the person who just proved they can read the
 * mailbox, exactly as it did when the exchange happened client-side.
 *
 * **No captcha and no rate limit of our own.** The captcha was spent at step 1,
 * and a per-IP limit here would strand a legitimate visitor behind a shared
 * address more often than it would slow an attacker with many. Brute-forcing
 * six digits is bounded by Supabase's own auth rate limits, which are the same
 * backstop the spec already relies on for the OTP endpoint itself.
 */
export async function POST(req: NextRequest) {
  if (!isAppSupabaseConfigured()) {
    console.error("[account-deletion/verify] CONFIG_MISSING_APP_SUPABASE — refusing requests");
    return fail(503, "CONFIG_MISSING_APP_SUPABASE");
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "INVALID_DATA");
  }

  const supabase = appSupabaseServer();
  if (!supabase) {
    return fail(503, "CONFIG_MISSING_APP_SUPABASE");
  }

  const { email, code } = parsed.data;

  try {
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });

    // One answer for a wrong code, an expired one, and an address with no
    // account: step 1 refuses to disclose whether an account exists, and a
    // different answer here would give that back. A session-less success counts
    // as failure too — without a token there is nothing to authorise the
    // deletion with, and advancing the UI would strand the caller at the last
    // step.
    if (error || !data.session) {
      console.info("[account-deletion/verify] code rejected:", error?.message ?? "no session returned");
      return fail(400, "CODE_INVALID");
    }

    return NextResponse.json({ ok: true, accessToken: data.session.access_token }, { status: 200 });
  } catch (err) {
    console.error("[account-deletion/verify] verifyOtp threw:", err);
    return fail(400, "CODE_INVALID");
  }
}
