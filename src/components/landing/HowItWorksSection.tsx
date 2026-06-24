import { UserPlus, Sparkles, ShoppingCart } from "lucide-react";
import type { Translations } from "@/lib/i18n/dictionaries";

interface HowItWorksProps {
  t: Translations["howItWorks"];
}

const ICONS = [
  <UserPlus key="up" className="size-7 text-primary" />,
  <Sparkles key="sp" className="size-7 text-primary" />,
  <ShoppingCart key="sc" className="size-7 text-primary" />,
];

export function HowItWorksSection({ t }: HowItWorksProps) {
  const steps = [t.step1, t.step2, t.step3];

  return (
    <section id="how" className="bg-secondary py-16 md:py-24">
      <div className="mx-auto max-w-[1240px] px-8">
        <div className="text-center lg:text-left">
          <p className="mb-3.5 text-[12px] font-semibold uppercase tracking-[1.2px] text-accent-foreground">
            {t.eyebrow}
          </p>
          <h2
            className="mb-4 font-display font-semibold text-gray-900"
            style={{ fontSize: "clamp(32px,4vw,52px)", lineHeight: 1.05, letterSpacing: "-1px" }}
          >
            {t.title}
          </h2>
          <p className="mx-auto max-w-[600px] text-lg leading-[1.55] text-muted-foreground lg:mx-0">{t.subtitle}</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="relative rounded-[18px] bg-white p-8 shadow-md">
              <p className="font-mono text-[11px] font-semibold tracking-[1px] text-accent-foreground">
                {step.num}
              </p>
              <div className="my-5 grid size-14 place-items-center rounded-2xl bg-accent">
                {ICONS[i]}
              </div>
              <h3 className="mb-2.5 font-display text-[22px] font-semibold tracking-[-0.25px] text-gray-900">
                {step.title}
              </h3>
              <p className="text-[15px] leading-[1.55] text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
