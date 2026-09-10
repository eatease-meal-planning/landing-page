import { NextResponse } from "next/server";

/**
 * Error response carrying a stable code the UI shows and support can grep.
 *
 * On these routes a silent failure is worse than a loud one: a dropped erasure
 * request is a compliance failure, and a dropped signup looked for weeks like
 * an absence of demand. Every non-success answer names its cause.
 *
 * `message` is for the few cases with something useful to say to the user
 * ("check your inbox"); otherwise the code stands on its own.
 */
export function fail(status: number, code: string, message?: string): NextResponse {
  return NextResponse.json({ error: message ?? code, code }, { status });
}
