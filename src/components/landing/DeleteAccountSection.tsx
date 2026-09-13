import { Check, Clock, Smartphone, Trash2 } from "lucide-react";
import type { Translations } from "@/lib/i18n/dictionaries";
import { SelfServiceDeletion } from "./deleteAccount/SelfServiceDeletion";
import { ManualRequestForm } from "./deleteAccount/ManualRequestForm";

type T = Translations["deleteAccount"];

/**
 * The compliance content is always visible and needs no login — the Play
 * Console requirement — and the two ways of actually deleting sit below it:
 * self-service with an emailed code, and the human fallback under a disclosure.
 *
 * This file renders on the server and ships no JavaScript of its own; the two
 * forms are the Client Components.
 */
export function DeleteAccountSection({ t, locale }: { t: T; locale: string }) {
  return (
    <main className="mx-auto w-full max-w-[760px] px-6 py-14 md:px-8 md:py-20">
      <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-foreground md:text-[38px]">
        {t.title}
      </h1>
      <p className="mt-4 text-[15px] leading-[1.72] text-muted-foreground">{t.intro}</p>

      <Card icon={<Trash2 className="size-4" />} title={t.whatIsDeleted.title}>
        <ul className="mt-3 grid gap-2">
          {t.whatIsDeleted.items.map((item) => (
            <li key={item} className="flex gap-2.5 text-[15px] leading-[1.6] text-muted-foreground">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </Card>

      <Card icon={<Check className="size-4" />} title={t.whatRemains.title}>
        <ul className="mt-3 grid gap-3">
          {t.whatRemains.items.map((item) => (
            <li key={item} className="flex gap-2.5 text-[15px] leading-[1.6] text-muted-foreground">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] leading-[1.6] text-muted-foreground/80">{t.whatRemains.note}</p>
      </Card>

      <Card icon={<Clock className="size-4" />} title={t.timing.title}>
        <p className="mt-3 text-[15px] leading-[1.72] text-muted-foreground">{t.timing.body}</p>
      </Card>

      <Card icon={<Smartphone className="size-4" />} title={t.inApp.title}>
        <p className="mt-3 text-[15px] leading-[1.72] text-muted-foreground">{t.inApp.body}</p>
      </Card>

      <SelfServiceDeletion t={t} locale={locale} />
      <ManualRequestForm t={t} locale={locale} />

      <div className="mt-10 rounded-lg bg-secondary px-6 py-5">
        <h2 className="text-[15px] font-semibold text-foreground">{t.contact.title}</h2>
        <p className="mt-2 text-[15px] leading-[1.7] text-muted-foreground">
          {t.contact.body}{" "}
          <a
            href={`mailto:${t.contact.email}`}
            className="text-primary underline underline-offset-2 transition-colors hover:text-teal-600"
          >
            {t.contact.email}
          </a>
        </p>
      </div>
    </main>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-lg bg-background p-6 shadow-card md:p-7">
      <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-foreground">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
