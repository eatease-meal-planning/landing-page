import type { NextRequest } from "next/server";

/** Client IP from the proxy header (reliable on Vercel/Cloudflare). */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

export interface TurnstileResult {
  ok: boolean;
  /**
   * Cloudflare's own error-codes, propagated so a caller can report *why* the
   * check failed. These name a misconfiguration class ("invalid-input-secret",
   * "timeout-or-duplicate") and carry no secret material, which is what makes
   * a failure diagnosable without shipping the secret anywhere.
   */
  codes: string[];
}

/** Verifies a Cloudflare Turnstile token. */
export async function verifyTurnstile(token: string, ip: string): Promise<TurnstileResult> {
  const secret = (process.env.TURNSTILE_SECRET_KEY ?? "").trim();
  if (!secret) {
    console.error("[Turnstile] TURNSTILE_SECRET_KEY is not set");
    return { ok: false, codes: ["missing-secret-env"] };
  }

  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    });
    const data = await res.json() as { success: boolean; "error-codes"?: string[] };
    const codes = data["error-codes"] ?? [];
    if (!data.success) console.error("[Turnstile] verification failed:", codes);
    return { ok: data.success === true, codes };
  } catch (err) {
    console.error("[Turnstile] fetch error:", err);
    return { ok: false, codes: ["fetch-error"] };
  }
}
