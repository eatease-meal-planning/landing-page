"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Translations } from "@/lib/i18n/dictionaries";
import { ErrorNotice } from "./StepEmail";

type T = Translations["deleteAccount"];

/**
 * Step 3: the irreversible one.
 *
 * The two notices are not decoration. Self-service deletion is immediate but
 * not complete, and each names one part it does not reach:
 *
 * - The trial record is keyed partly on the sign-in provider identifier, which
 *   lives in `auth.identities` and disappears with the account. An article 21
 *   objection has to be raised *before* this button, or the record can never be
 *   matched to the person again. The manual flow gave the operator that window;
 *   this one does not.
 * - The closed-test tester list lives in the Play Console, which has no API we
 *   can reach (`edits.testers` only accepts Google Groups, and there is no
 *   group). Removing an address there is manual, forever.
 *
 * The checkbox exists so the red button cannot be the first click that destroys
 * anything, and red appears here and nowhere else on the page.
 */
export function StepConfirm({
  t,
  busy,
  error,
  onConfirm,
}: {
  t: T;
  busy: boolean;
  error: string;
  onConfirm: () => Promise<void>;
}) {
  const [understood, setUnderstood] = useState(false);

  return (
    <>
      <p className="mt-3 text-[15px] leading-[1.72] text-muted-foreground">{t.selfService.step3.body}</p>

      <div className="mt-5 grid gap-3">
        <Warning>{t.selfService.step3.warningTrial}</Warning>
        <Warning>{t.selfService.step3.warningTesters}</Warning>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[15px] leading-[1.6] text-foreground">
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
          disabled={busy}
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-red-600 disabled:opacity-50"
        />
        {t.selfService.step3.checkbox}
      </label>

      {error && <div className="mt-4"><ErrorNotice>{error}</ErrorNotice></div>}

      <button
        type="button"
        onClick={onConfirm}
        disabled={busy || !understood}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-red-600 px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-[150ms] hover:-translate-y-px hover:bg-red-700 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
      >
        {busy ? t.selfService.step3.submitting : t.selfService.step3.submit}
      </button>
    </>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2.5 rounded-md bg-secondary px-4 py-3 text-[13px] leading-[1.65] text-muted-foreground">
      <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-500" />
      {children}
    </p>
  );
}
