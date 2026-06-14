import { ArrowRight } from "lucide-react";
import type { Translations } from "@/lib/i18n/dictionaries";

interface FeaturesProps {
  t: Translations["features"];
}

const MACRO_RING_DEFS = [
  { pct: 65, color: "#3b82f6", value: "96g",  key: "protein" as const },
  { pct: 82, color: "#22c55e", value: "164g", key: "carbs"   as const },
  { pct: 48, color: "#f59e0b", value: "31g",  key: "fat"     as const },
];

export function FeaturesSection({ t }: FeaturesProps) {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-310 px-8">
        <p className="mb-3.5 text-[12px] font-semibold uppercase tracking-[1.2px] text-accent-foreground">
          {t.eyebrow}
        </p>
        <h2
          className="font-display font-semibold text-gray-900"
          style={{ fontSize: "clamp(32px,4vw,52px)", lineHeight: 1.05, letterSpacing: "-1px" }}
        >
          {t.title}
        </h2>

        {/* Bento grid */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-6 md:[grid-template-rows:380px_320px]">
          {/* Card 1 — Macros (col 1-3, row 1) */}
          <div
            className="relative overflow-hidden rounded-[22px] border border-border p-9 md:col-span-3"
            style={{ background: "linear-gradient(135deg, #f0fdfa, white)" }}
          >
            <h3 className="mb-2.5 font-display text-2xl font-semibold tracking-[-0.25px] text-gray-900">
              {t.card1.title}
            </h3>
            <p className="text-[14px] text-muted-foreground">{t.card1.sub}</p>
            {/* Macro dashboard */}
            <div className="mt-6 rounded-xl bg-gray-50 p-4 shadow-card">
              <div className="flex items-center gap-4">
                {/* Calorie ring */}
                <div className="shrink-0">
                  <div
                    className="grid size-22 place-items-center rounded-full"
                    style={{ background: "conic-gradient(#14b8a6 0 72%, #e5e7eb 72% 100%)" }}
                  >
                    <div className="grid size-18 place-items-center rounded-full bg-gray-50 text-center">
                      <div>
                        <div className="font-mono text-[13px] font-bold leading-tight text-gray-900">1,540</div>
                        <div className="text-[10px] text-muted-foreground">{t.card1.calories}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Macro rings */}
                <div className="grid flex-1 grid-cols-3 gap-2">
                  {MACRO_RING_DEFS.map(({ pct, color, value, key }) => (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <div
                        className="size-11 rounded-full"
                        style={{ background: `conic-gradient(${color} 0 ${pct}%, #e5e7eb ${pct}% 100%)` }}
                      />
                      <div className="font-mono text-[12px] font-bold text-gray-900">{value}</div>
                      <div className="text-[11px] font-medium text-muted-foreground">{t.card1[key]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 — Snap Fridge (col 4-6, row 1) */}
          <div className="flex flex-col overflow-hidden rounded-[22px] border border-border bg-white p-9 md:col-span-3">
            <h3 className="mb-2.5 font-display text-2xl font-semibold tracking-[-0.25px] text-gray-900">
              {t.card2.title}
            </h3>
            <p className="mb-6 text-[14px] text-muted-foreground">{t.card2.sub}</p>
            {/* Snap fridge demo — full width */}
            <div
              className="relative min-h-40 flex-1 overflow-hidden rounded-xl"
              style={{
                background: "url('https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop') center/cover",
              }}
            >
              <span className="absolute left-[10%] top-[14%] rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
                {t.card2.ingredient1}
              </span>
              <span className="absolute right-[14%] top-[35%] rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
                {t.card2.ingredient2}
              </span>
              <span className="absolute bottom-[26%] left-[16%] rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
                {t.card2.ingredient3}
              </span>
              <span className="absolute bottom-[12%] right-[18%] rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
                {t.card2.ingredient4}
              </span>
            </div>
          </div>

          {/* Card 3 — Family (col 1-2, row 2) — dark */}
          <div className="relative overflow-hidden rounded-[22px] border-0 bg-gray-900 p-9 text-white md:col-span-2">
            <h3 className="mb-2.5 font-display text-2xl font-semibold tracking-[-0.25px] text-white">
              {t.card3.title}
            </h3>
            <p className="text-[14px] text-white/85">{t.card3.sub}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { av: "M", name: t.card3.memberYou,      bg: "#14b8a6" },
                { av: "D", name: t.card3.memberSpouse,   bg: "#f59e0b" },
                { av: "L", name: t.card3.memberDaughter, bg: "#a855f7" },
                { av: "T", name: t.card3.memberSon,      bg: "#3b82f6" },
              ].map(({ av, name, bg }) => (
                <span
                  key={name}
                  className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-[13px] font-medium text-white"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <span
                    className="grid size-6.5 place-items-center rounded-full text-[11px] font-bold"
                    style={{ background: bg }}
                  >
                    {av}
                  </span>
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Card 4 — Shopping list (col 3-4, row 2) — teal */}
          <div className="relative overflow-hidden rounded-[22px] border-0 bg-primary p-9 text-white md:col-span-2">
            <h3 className="mb-2.5 font-display text-2xl font-semibold tracking-[-0.25px] text-white">
              {t.card4.title}
            </h3>
            <p className="mb-4 text-[14px] text-white/85">{t.card4.sub}</p>
            <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.12)" }}>
              {[
                { name: "Chicken breast", qty: "600g", done: true },
                { name: "Cherry tomatoes", qty: "250g", done: false },
                { name: "Quinoa", qty: "300g", done: false },
              ].map(({ name, qty, done }) => (
                <div
                  key={name}
                  className="flex items-center gap-2.5 py-1.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <span
                    className="grid size-4.5 shrink-0 place-items-center rounded-[5px]"
                    style={done
                      ? { background: "white" }
                      : { border: "2px solid rgba(255,255,255,0.4)" }
                    }
                  >
                    {done && (
                      <svg className="size-3 text-primary" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1 text-[13px]" style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.65 : 1 }}>
                    {name}
                  </span>
                  <span className="font-mono text-[11px] opacity-70">{qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5 — Swap (col 5-6, row 2) */}
          <div className="relative overflow-hidden rounded-[22px] border border-border bg-white p-9 md:col-span-2">
            <h3 className="mb-2.5 font-display text-2xl font-semibold tracking-[-0.25px] text-gray-900">
              {t.card5.title}
            </h3>
            <p className="text-[14px] text-muted-foreground">{t.card5.sub}</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2 text-[12px] font-semibold">
                <span className="text-red-500">✕</span>
                Spaghetti carbonara
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#22c55e] px-3 py-2 text-[12px] font-semibold text-white">
                ✓ Grilled salmon bowl
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
