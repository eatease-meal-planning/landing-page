import { Camera, Share2, PieChart, Users } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import type { Translations } from "@/lib/i18n/dictionaries";

interface CtaProps {
  t: Translations["cta"];
  tForm: Translations["form"];
  locale: string;
}

const PERK_ICONS = [
  <Camera key="c" className="size-5 shrink-0 mt-0.5 text-teal-300" />,
  <Share2 key="s" className="size-5 shrink-0 mt-0.5 text-teal-300" />,
  <PieChart key="p" className="size-5 shrink-0 mt-0.5 text-teal-300" />,
  <Users key="u" className="size-5 shrink-0 mt-0.5 text-teal-300" />,
];

export function CtaSection({ t, tForm, locale }: CtaProps) {
  const perks = [t.perk1, t.perk2, t.perk3, t.perk4];

  return (
    <section
      id="cta"
      className="py-30 text-center text-white"
      style={{
        background: "radial-gradient(circle at 50% 100%, rgba(20,184,166,0.18), transparent 50%), #111827",
      }}
    >
      <div className="mx-auto max-w-310 px-8">
        <p className="mb-3.5 text-[12px] font-semibold uppercase tracking-[1.2px] text-teal-300">
          {t.eyebrow}
        </p>
        <h2
          className="mb-5 whitespace-pre-line font-display font-semibold"
          style={{ fontSize: "clamp(36px,5vw,64px)", lineHeight: 1.05, letterSpacing: "-1.5px" }}
        >
          {t.title}
        </h2>
        <p className="mx-auto mb-9 max-w-135 text-lg leading-normal text-white/75">
          {t.subtitle}
        </p>

        {/* Perk cards */}
        <div className="mx-auto mb-10 grid max-w-230 grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {PERK_ICONS[i]}
              <div>
                <b className="mb-0.5 block text-[14px] font-semibold text-white">{perk.title}</b>
                <span className="text-[12px] leading-[1.4] text-white/60">{perk.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Waitlist form — lives here now (scroll target for nav CTA) */}
        <div id="waitlist" className="mx-auto max-w-sm scroll-mt-24 text-left">
          <ContactForm t={tForm} locale={locale} />
        </div>
      </div>
    </section>
  );
}
