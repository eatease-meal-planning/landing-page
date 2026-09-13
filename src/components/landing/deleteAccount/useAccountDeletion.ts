"use client";

import { useCallback, useState } from "react";
import type { Translations } from "@/lib/i18n/dictionaries";

type T = Translations["deleteAccount"];

export type DeletionStep = "email" | "code" | "confirm" | "done";

export interface AccountDeletion {
  step: DeletionStep;
  busy: boolean;
  /** Already translated, and carrying the server's code where there is one. */
  error: string;
  email: string;
  requestCode(email: string, turnstileToken: string | null): Promise<void>;
  submitCode(code: string): Promise<void>;
  confirmDeletion(): Promise<void>;
  restart(): void;
}

/** A failure with something the user can quote back to us. */
function withCode(message: string, code: string | null): string {
  return code ? `${message} (${code})` : message;
}

async function codeOf(res: Response): Promise<string | null> {
  return res.json().then((body) => body?.code ?? null).catch(() => null);
}

/**
 * The three-step deletion: address → emailed code → explicit confirmation.
 *
 * The state machine and the two chained calls live here rather than in a
 * submit handler, because one of them is a rule the spec calls non-negotiable
 * and a rule buried in markup is a rule nobody can see.
 *
 * **Every call goes to our own API.** The Supabase client used to live here,
 * which meant serving the app project's URL and anon key in the browser bundle;
 * the two exchanges it did are now `/verify` and `/confirm`. The token is the
 * same token, belonging to the same person — it is simply obtained one hop
 * further back, and this page now ships no Supabase client at all.
 *
 * The access token is held in state: it exists only for this flow, a ref would
 * not survive a remount, and nothing should persist it anywhere.
 */
export function useAccountDeletion({ t, locale }: { t: T; locale: string }): AccountDeletion {
  const [step, setStep]   = useState<DeletionStep>("email");
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const requestCode = useCallback(
    async (address: string, turnstileToken: string | null) => {
      if (!turnstileToken) {
        setError(t.form.errorCaptcha);
        return;
      }

      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/account-deletion/request", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: address, locale, cfTurnstileToken: turnstileToken }),
        });

        if (res.ok) {
          // The answer is the same whether or not an account exists, so this is
          // the only outcome there is: the next step says "if an account
          // exists, a code is on its way".
          setEmail(address);
          setStep("code");
          return;
        }

        setError(
          res.status === 429
            ? t.form.errorRateLimit
            : withCode(t.form.errorGeneric, await codeOf(res)),
        );
      } catch {
        setError(t.form.errorNetwork);
      } finally {
        setBusy(false);
      }
    },
    [locale, t],
  );

  const submitCode = useCallback(
    async (code: string) => {
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/account-deletion/verify", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email, code }),
        });

        // CODE_INVALID covers a wrong code, an expired one and an address with
        // no account alike — step 1 refuses to say which, and this step must
        // not say it either.
        if (!res.ok) {
          setError(t.selfService.step2.errorCode);
          return;
        }

        const { accessToken: token } = (await res.json()) as { accessToken?: string };
        if (!token) {
          // Nothing to authorise the deletion with. Advancing would show the
          // final step to someone who cannot complete it.
          setError(t.selfService.step2.errorCode);
          return;
        }

        setAccessToken(token);
        setStep("confirm");
      } catch {
        setError(t.form.errorNetwork);
      } finally {
        setBusy(false);
      }
    },
    [email, t],
  );

  const confirmDeletion = useCallback(async () => {
    if (!accessToken) {
      setError(withCode(t.form.errorGeneric, "NO_VERIFIED_SESSION"));
      return;
    }
    const authorization = { Authorization: `Bearer ${accessToken}` };

    setBusy(true);
    setError("");
    try {
      // ORDER IS THE RULE. The landing-page registration goes first: it is
      // reversible in practice (the person can sign up again) and idempotent.
      // The app account goes last because it is irreversible — and because
      // destroying it first invalidates the very token needed to reach that
      // row, leaving it unreachable for good.
      const registration = await fetch("/api/account-deletion/registration", {
        method:  "POST",
        headers: authorization,
      });
      if (!registration.ok) {
        // Deliberately stops here: nothing has been destroyed yet, and that is
        // the state to preserve.
        setError(withCode(t.selfService.step3.errorRegistration, await codeOf(registration)));
        return;
      }

      const deletion = await fetch("/api/account-deletion/confirm", {
        method:  "POST",
        headers: authorization,
      });
      if (!deletion.ok) {
        setError(withCode(t.form.errorGeneric, await codeOf(deletion)));
        return;
      }

      setStep("done");
    } catch {
      setError(t.form.errorNetwork);
    } finally {
      setBusy(false);
    }
  }, [accessToken, t]);

  const restart = useCallback(() => {
    setStep("email");
    setEmail("");
    setAccessToken("");
    setError("");
  }, []);

  return { step, busy, error, email, requestCode, submitCode, confirmDeletion, restart };
}
