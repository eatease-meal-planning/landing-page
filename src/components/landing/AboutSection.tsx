import { Clock, Heart, Leaf } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Translations } from "@/lib/i18n/dictionaries";

interface AboutSectionProps {
  t: Translations["aboutUs"];
  locale: Locale;
  joinWaitlist: string;
}

const VALUE_ICONS = [
  <Clock key="clock" className="size-6 text-primary" />,
  <Heart key="heart" className="size-6 text-primary" />,
  <Leaf key="leaf" className="size-6 text-primary" />,
];

export function AboutSection({ t, locale, joinWaitlist }: AboutSectionProps) {
  const values = [t.value1, t.value2, t.value3];

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-background pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="mx-auto max-w-[820px] px-8 text-center">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[1.2px] text-accent-foreground">
            {t.eyebrow}
          </p>
          <h1
            className="font-display font-semibold text-gray-900"
            style={{ fontSize: "clamp(34px,5vw,60px)", lineHeight: 1.04, letterSpacing: "-1.5px" }}
          >
            {t.title}
          </h1>
          <p
            className="mt-8 font-display font-medium text-primary"
            style={{ fontSize: "clamp(24px,3.4vw,38px)", lineHeight: 1.2, letterSpacing: "-0.5px" }}
          >
            {t.question}
          </p>
          <p className="mx-auto mt-8 max-w-[640px] text-lg leading-[1.6] text-muted-foreground">
            {t.lead}
          </p>
        </div>
      </section>

      {/* ── Story ─────────────────────────────────────────────── */}
      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-[760px] px-8">
          <p className="text-xl leading-[1.65] text-foreground">{t.story1}</p>
          <p className="mt-6 text-lg leading-[1.65] text-muted-foreground">{t.story2}</p>
        </div>
      </section>

      {/* ── Mission + values ──────────────────────────────────── */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-[1240px] px-8">
          <div className="rounded-[24px] bg-accent px-8 py-14 md:px-16">
            <div className="max-w-[640px]">
              <p className="mb-3.5 text-[12px] font-semibold uppercase tracking-[1.2px] text-accent-foreground">
                {t.missionEyebrow}
              </p>
              <h2
                className="mb-5 font-display font-semibold text-gray-900"
                style={{ fontSize: "clamp(28px,3.5vw,44px)", lineHeight: 1.08, letterSpacing: "-1px" }}
              >
                {t.missionTitle}
              </h2>
              <p className="text-lg leading-[1.6] text-foreground/80">{t.missionBody}</p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {values.map((v, i) => (
                <div key={i} className="rounded-[18px] bg-white p-7 shadow-card">
                  <div className="mb-5 grid size-12 place-items-center rounded-2xl bg-accent">
                    {VALUE_ICONS[i]}
                  </div>
                  <h3 className="mb-2 font-display text-[19px] font-semibold tracking-[-0.25px] text-gray-900">
                    {v.title}
                  </h3>
                  <p className="text-[15px] leading-[1.55] text-muted-foreground">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing CTA ───────────────────────────────────────── */}
      <section className="bg-primary py-20">
        <div className="mx-auto max-w-205 px-8 text-center">
          <p
            className="font-display font-semibold text-white"
            style={{ fontSize: "clamp(26px,3.4vw,40px)", lineHeight: 1.1, letterSpacing: "-0.5px" }}
          >
            {t.closingCta}
          </p>
          <a
            href={`/${locale}#waitlist`}
            className="mt-8 inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-white/90 hover:shadow-md"
          >
            {joinWaitlist}
          </a>
        </div>
      </section>
    </main>
  );
}
