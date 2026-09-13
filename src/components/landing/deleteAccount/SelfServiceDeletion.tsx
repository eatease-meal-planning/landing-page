"use client";

import { Check, Trash2 } from "lucide-react";
import type { Translations } from "@/lib/i18n/dictionaries";
import { useAccountDeletion } from "./useAccountDeletion";
import { StepEmail } from "./StepEmail";
import { StepCode } from "./StepCode";
import { StepConfirm } from "./StepConfirm";

type T = Translations["deleteAccount"];

/**
 * Container for the three steps. It holds no logic of its own: the machine is
 * `useAccountDeletion`, the markup is in the three step components, and this
 * file only decides which one is on screen.
 */
export function SelfServiceDeletion({ t, locale }: { t: T; locale: string }) {
  const deletion = useAccountDeletion({ t, locale });

  if (deletion.step === "done") {
    return (
      <section className="mt-8 rounded-lg border border-primary/25 bg-accent p-6 md:p-7">
        <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-foreground">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-4" />
          </span>
          {t.selfService.done.title}
        </h2>
        <p className="mt-3 text-[15px] leading-[1.72] text-accent-foreground">{t.selfService.done.body}</p>
      </section>
    );
  }

  const heading =
    deletion.step === "email"   ? t.selfService.title
    : deletion.step === "code"  ? t.selfService.step2.title
    :                             t.selfService.step3.title;

  return (
    <section className="mt-8 rounded-lg bg-background p-6 shadow-card md:p-7">
      <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-foreground">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          <Trash2 className="size-4" />
        </span>
        {heading}
      </h2>

      {deletion.step === "email" && (
        <>
          <p className="mt-3 text-[15px] leading-[1.72] text-muted-foreground">{t.selfService.intro}</p>
          <StepEmail t={t} busy={deletion.busy} error={deletion.error} onSubmit={deletion.requestCode} />
        </>
      )}

      {deletion.step === "code" && (
        <StepCode
          t={t}
          busy={deletion.busy}
          error={deletion.error}
          onSubmit={deletion.submitCode}
          onRestart={deletion.restart}
        />
      )}

      {deletion.step === "confirm" && (
        <StepConfirm t={t} busy={deletion.busy} error={deletion.error} onConfirm={deletion.confirmDeletion} />
      )}
    </section>
  );
}
