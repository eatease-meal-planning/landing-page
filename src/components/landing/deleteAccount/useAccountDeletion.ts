"use client";

import { useCallback, useState } from "react";
import type { Translations } from "@/lib/i18n/dictionaries";
import { appSupabaseBrowser } from "@/lib/appSupabase";

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
 * The access token is held in state rather than read back from the Supabase
 * client: that client runs with `persistSession: false`, so there is no session
 * to read, and a token kept in a ref would not survive a remount either.
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
      const supabase = appSupabaseBrowser();
      if (!supabase) {
        setError(withCode(t.form.errorGeneric, "CONFIG_MISSING_APP_SUPABASE"));
        return;
      }

      setBusy(true);
      setError("");
      try {
        const { data, error: otpError } = await supabase.auth.verifyOtp({
          email,
          token: code,
          type:  "email",
        });

        // No session means no token to authorise the deletion with. Advancing
        // would show the final step to someone who cannot complete it.
        if (otpError || !data.session) {
          setError(t.selfService.step2.errorCode);
          return;
        }

        setAccessToken(data.session.access_token);
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
    const supabase = appSupabaseBrowser();
    if (!supabase || !accessToken) {
      setError(withCode(t.form.errorGeneric, "NO_VERIFIED_SESSION"));
      return;
    }
    const authorization = { Authorization: `Bearer ${accessToken}` };

    setBusy(true);
    setError("");
    try {
      // ORDER IS THE RULE. The landing-page row goes first: it is reversible in
      // practice (the person can sign up again) and idempotent. The app account
      // goes last because it is irreversible — and because destroying it first
      // invalidates the very token needed to reach the row, leaving it
      // unreachable for good.
      const waitlist = await fetch("/api/account-deletion/waitlist", {
        method:  "POST",
        headers: authorization,
      });
      if (!waitlist.ok) {
        // Deliberately stops here: nothing has been destroyed yet, and that is
        // the state to preserve.
        setError(withCode(t.selfService.step3.errorWaitlist, await codeOf(waitlist)));
        return;
      }

      const { error: functionError } = await supabase.functions.invoke("delete-account", {
        method:  "POST",
        headers: authorization,
        body:    {},
      });
      if (functionError) {
        setError(withCode(t.form.errorGeneric, functionError.name ?? "DELETE_ACCOUNT_FAILED"));
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
