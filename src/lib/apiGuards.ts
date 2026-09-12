import type { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { fail } from "@/lib/apiError";
import { getClientIp, verifyTurnstile } from "@/lib/turnstile";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Returns a stable error code when something the route needs is not configured,
 * or null when it is. It runs before any work, so it must not do I/O.
 */
export type ConfigCheck = () => string | null;

/** A schema is only usable here if it carries the captcha token. */
type GuardedBody = { cfTurnstileToken: string };

export interface RequestGuardOptions<S extends z.ZodType<GuardedBody>> {
  /** Prefix for this route's server logs, e.g. "account-deletion/request". */
  name: string;
  /**
   * Prefix for the rate-limit key. `rate_limits.ip` is one shared table, so
   * each endpoint takes its own budget for a visitor: `del:`, `wl:`, …
   */
  rateLimitPrefix: string;
  schema: S;
  configChecks?: ConfigCheck[];
}

export type RequestGuardResult<S extends z.ZodType<GuardedBody>> =
  | { ok: true; ip: string; data: z.infer<S> }
  | { ok: false; response: NextResponse };

/**
 * The four checks every public POST on this site runs, in the one order that
 * makes each of them diagnosable.
 *
 * **Configuration first,** because it is what a fresh deploy is most likely to
 * get wrong and because putting it ahead of the captcha makes it reachable with
 * a plain curl — no valid Turnstile token needed to see which variable is
 * missing. **Rate limit second,** before the body is even read. **Zod third.**
 * **Turnstile last,** because it is the only step that costs a network call.
 *
 * Every failure carries a stable code: on these routes a silent failure is
 * worse than a loud one — a dropped erasure request is a compliance failure,
 * and a dropped signup looked for weeks like an absence of demand.
 *
 * Known defect, inherited and unchanged: the rate-limit counter increments
 * before validation, so failures caused by our own bugs spend the visitor's
 * budget. Misconfiguration is the exception — it is caught above the counter.
 */
export async function runRequestGuards<S extends z.ZodType<GuardedBody>>(
  req: NextRequest,
  { name, rateLimitPrefix, schema, configChecks = [] }: RequestGuardOptions<S>,
): Promise<RequestGuardResult<S>> {
  for (const check of configChecks) {
    const code = check();
    if (code) {
      console.error(`[${name}] ${code} — refusing requests`);
      return { ok: false, response: fail(503, code) };
    }
  }

  const ip = getClientIp(req);

  let limited: boolean;
  try {
    limited = await checkRateLimit(`${rateLimitPrefix}:${ip}`);
  } catch (err) {
    // A cold or paused database used to surface as an empty-body 500 that told
    // nobody anything.
    console.error(`[${name}] rate limit check failed:`, err);
    return { ok: false, response: fail(503, "DB_UNAVAILABLE") };
  }
  if (limited) {
    return {
      ok: false,
      response: fail(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes and try again."),
    };
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, response: fail(400, "INVALID_DATA") };
  }
  const data = parsed.data as z.infer<S>;

  const captcha = await verifyTurnstile(data.cfTurnstileToken, ip);
  if (!captcha.ok) {
    // Cloudflare's code names the cause: invalid-input-secret (site key and
    // secret are from different widgets), timeout-or-duplicate (token expired
    // or replayed), missing-secret-env, …
    return {
      ok: false,
      response: fail(400, `CAPTCHA_FAILED:${captcha.codes.join(",") || "unknown"}`),
    };
  }

  return { ok: true, ip, data };
}
