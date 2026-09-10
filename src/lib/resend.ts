import { Resend } from "resend";

let client: Resend | null = null;
let builtFor: string | null = null;

/**
 * The Resend client, or null when RESEND_API_KEY is not configured.
 *
 * Building it at module scope is what we are avoiding: `new Resend(undefined)`
 * throws, so an unconfigured deployment kills the route on import and the
 * handler's CONFIG_MISSING_RESEND branch never runs — the caller gets a
 * generic 500 with no code to quote back to us.
 *
 * Returning null instead moves the decision into the request, where it can be
 * reported. The instance is cached so this stays one client per process.
 */
export function getResend(): Resend | null {
  const key = (process.env.RESEND_API_KEY ?? "").trim();
  if (!key) return null;

  if (!client || builtFor !== key) {
    client = new Resend(key);
    builtFor = key;
  }
  return client;
}
