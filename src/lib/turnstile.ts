import type { NextRequest } from "next/server";

/** Client IP from the proxy header (reliable on Vercel/Cloudflare). */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

/** Verifies a Cloudflare Turnstile token. Returns false on any failure. */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    const body = new URLSearchParams({
      secret:   (process.env.TURNSTILE_SECRET_KEY ?? "").trim(),
      response: token,
      remoteip: ip,
    });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
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
