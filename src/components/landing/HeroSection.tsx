import { Sparkles, Check, ShoppingCart, ArrowRight } from "lucide-react";
import type { Translations } from "@/lib/i18n/dictionaries";

interface HeroProps {
  t: Translations["hero"];
}

export function HeroSection({ t }: HeroProps) {
  return (
    <header className="relative overflow-hidden pb-16 pt-20 lg:pb-0">
      {/* Subtle teal radial glow — anchored to the hero's full height (bottom: 0) and
          stretched to the right edge so its box boundary never shows as a hard vertical
          seam on tall (mobile) layouts. */}
      <div
        className="pointer-events-none absolute z-0"
        style={{
          inset: "-10% 0 0 -20%",
          background: "radial-gradient(circle at 30% 50%, rgba(20,184,166,0.10), transparent 55%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-310 px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:[grid-template-columns:1.05fr_1fr]">

          {/* ── Left column ────────────────────────────────────── */}
          <div className="text-center lg:text-left">
            {/* Eyebrow badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-accent px-3 py-1.5 text-[12px] font-semibold text-accent-foreground">
              <Sparkles className="size-3" />
              {t.badge}
            </div>

            <h1
              className="mb-6 font-display font-semibold text-gray-900"
              style={{ fontSize: "clamp(44px, 6.2vw, 76px)", lineHeight: 1.02, letterSpacing: "-1.8px" }}
            >
              {t.headlineLine1}<br />
              <em className="not-italic font-medium text-accent-foreground">{t.headlineLine2}</em>
            </h1>

            <p className="mb-9 max-w-135 text-xl leading-[1.55] text-muted-foreground mx-auto lg:mx-0">
              {t.description}
            </p>

            {/* App store buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {/* Apple App Store */}
              <a
                href="#"
                aria-label={t.appStoreAriaLabel}
                className="inline-flex items-center gap-3 rounded-xl bg-gray-900 px-5 py-3 text-white transition-[background-color,transform] duration-150 hover:bg-gray-800 hover:-translate-y-px"
              >
                <svg className="size-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.15-.47 7.82 1.3 10.38.86 1.25 1.89 2.66 3.24 2.61 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.29-1.28 3.15-2.54.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.75-4.13zM14.53 4.41c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.28.69-3.02 1.55-.66.77-1.24 2-1.09 3.18 1.15.09 2.32-.58 3.04-1.44z" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] font-medium text-white/70">{t.appStorePre}</span>
                  <span className="block text-[17px] font-semibold">App Store</span>
                </span>
              </a>

              {/* Google Play */}
              <a
                href="#"
                aria-label={t.googlePlayAriaLabel}
                className="inline-flex items-center gap-3 rounded-xl bg-gray-900 px-5 py-3 text-white transition-[background-color,transform] duration-150 hover:bg-gray-800 hover:-translate-y-px"
              >
                <svg className="size-6" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.6 1.84a1.5 1.5 0 0 0-.35 1v18.32a1.5 1.5 0 0 0 .35 1L13.8 12 3.6 1.84z" fill="#34d399" />
                  <path d="M17.92 8.16 13.8 12l4.12 3.84 4.78-2.72c.78-.45.78-1.79 0-2.24l-4.78-2.72z" fill="#fbbf24" />
                  <path d="M3.6 22.16c.27.27.7.32 1.13.07l13.19-7.39L13.8 12 3.6 22.16z" fill="#f87171" />
                  <path d="M3.6 1.84 13.8 12l4.12-3.84L4.73 1.77c-.43-.25-.86-.2-1.13.07z" fill="#60a5fa" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] font-medium text-white/70">{t.googlePlayPre}</span>
                  <span className="block text-[17px] font-semibold">Google Play</span>
                </span>
              </a>
            </div>

            {/* How it works link — always on its own line, below the store buttons */}
            <a
              href="#how"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {t.seeHow}
              <ArrowRight className="size-4" />
            </a>

            {/* Stats row */}
            <div className="mt-12 flex flex-wrap justify-center gap-9 border-t border-border pt-8 lg:justify-start">
              {[
                { n: t.stat1Value, l: t.stat1Label },
                { n: t.stat2Value, l: t.stat2Label },
                { n: t.stat3Value, l: t.stat3Label },
              ].map(({ n, l }) => (
                <div key={n}>
                  <div className="font-display text-[32px] font-semibold leading-none tabular-nums text-gray-900" style={{ letterSpacing: "-0.5px" }}>
                    {n}
                  </div>
                  <div className="mt-1.5 text-[13px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column — phone mockup ────────────────────── */}
          <div className="relative" style={{ perspective: "1200px" }}>
            {/* Float card 1 — top left */}
            <div
              className="absolute left-10 top-25 z-10 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3.5 lg:flex"
              style={{ boxShadow: "0 20px 40px -10px rgba(17,24,39,0.15), 0 8px 16px -8px rgba(17,24,39,0.1)" }}
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#22c55e] text-white">
                <Check className="size-4.5" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-gray-900">{t.floatCard1Title}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{t.floatCard1Sub}</div>
              </div>
            </div>

            {/* Phone scale wrapper — shrinks the fixed 360×740 mockup to fit small screens.
                Negative margins collapse the empty space left by the scale transform. */}
            <div className="origin-top scale-[0.7] -mb-[222px] sm:scale-[0.85] sm:-mb-[111px] md:scale-95 md:-mb-[37px] lg:scale-100 lg:mb-0">
            {/* Phone shell */}
            <div
              className="relative mx-auto lg:[transform:rotateY(-6deg)_rotateX(2deg)]"
              style={{
                width: 360, height: 740,
                background: "#111827",
                borderRadius: 44,
                padding: 8,
                boxShadow: "0 40px 80px -20px rgba(20,184,166,0.18), 0 30px 60px -30px rgba(17,24,39,0.45)",
              }}
            >
              {/* Dynamic island / notch */}
              <div
                style={{
                  position: "absolute", top: 20, left: "50%",
                  transform: "translateX(-50%)",
                  width: 100, height: 30,
                  background: "#111827", borderRadius: 99, zIndex: 3,
                }}
              />

              {/* Screen */}
              <div className="relative size-full overflow-hidden bg-white" style={{ borderRadius: 38 }}>
                {/* App header */}
                <div className="px-5.5 pb-3.5 pt-14">
                  <div className="font-display text-[22px] font-bold text-gray-900" style={{ letterSpacing: "-0.25px" }}>
                    {t.appGreeting}
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted-foreground">
                    {t.appDailyInfo}
                  </div>
                </div>

                {/* Macro card */}
                <div className="mx-4.5 mb-3.5 rounded-[14px] bg-gray-50 p-3.5" style={{ boxShadow: "0 4px 8px rgba(17,24,39,0.10)" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-display text-[15px] font-bold text-gray-900">{t.appDailyMacros}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{t.appTrackGoals}</div>
                    </div>
                    <ArrowRight className="size-4.5 text-primary" />
                  </div>
                  <div className="mt-3 flex items-center gap-3.5">
                    {/* Main calorie ring */}
                    <div
                      className="relative size-17.5 shrink-0 rounded-full"
                      style={{ background: "conic-gradient(#14b8a6 0 72%, #e5e7eb 72% 100%)" }}
                    >
                      <div className="absolute inset-1.75 grid place-items-center rounded-full bg-gray-50">
                        <div className="text-center">
                          <div className="font-mono text-[12px] font-bold text-gray-900">1,540</div>
                          <div className="text-[9px] text-muted-foreground">kcal</div>
                        </div>
                      </div>
                    </div>
                    {/* Macro mini rings */}
                    <div className="grid flex-1 grid-cols-3 gap-1">
                      {[
                        { bg: "conic-gradient(#3b82f6 0 65%, #e5e7eb 65% 100%)", v: "96g", l: t.appMacroProtein },
                        { bg: "conic-gradient(#22c55e 0 82%, #e5e7eb 82% 100%)", v: "164g", l: t.appMacroCarbs },
                        { bg: "conic-gradient(#f59e0b 0 48%, #e5e7eb 48% 100%)", v: "31g", l: t.appMacroFat },
                      ].map(({ bg, v, l }) => (
                        <div key={l} className="flex flex-col items-center gap-0.5">
                          <div className="size-8 rounded-full" style={{ background: bg }} />
                          <div className="font-mono text-[10px] font-bold text-gray-900">{v}</div>
                          <div className="text-[9px] text-muted-foreground">{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Today's meals header */}
                <div className="mb-1.5 flex items-center gap-1.5 px-5.5">
                  <svg className="size-3.5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="font-display text-[15px] font-bold text-gray-900">{t.appTodaysMeals}</div>
                </div>

                {/* Meal cards */}
                {[
                  {
                    img: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=200&h=200&fit=crop",
                    gradient: "linear-gradient(135deg,#f59e0b,#ea580c)",
                    label: t.appMealBreakfast, meta: "5 min · 1 serv", score: "82%",
                    title: t.appMeal1Title,
                  },
                  {
                    img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&h=200&fit=crop",
                    gradient: "linear-gradient(135deg,#3b82f6,#6366f1)",
                    label: t.appMealLunch, meta: "30 min · 4 serv", score: "78%",
                    title: t.appMeal2Title,
                  },
                  {
                    img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop",
                    gradient: "linear-gradient(135deg,#a855f7,#ec4899)",
                    label: t.appMealDinner, meta: "25 min · 2 serv", score: "91%",
                    title: t.appMeal3Title,
                  },
                ].map(({ img, gradient, label, meta, score, title }) => (
                  <div
                    key={label}
                    className="mx-4.5 mb-2.5 grid overflow-hidden rounded-[10px] bg-white"
                    style={{ gridTemplateColumns: "78px 1fr", boxShadow: "0 4px 8px rgba(17,24,39,0.10)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={title} loading="lazy" decoding="async" className="size-full object-cover" />
                    <div className="px-2.5 py-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ background: gradient }}
                        >
                          {label}
                        </span>
                        <span className="text-[9px] text-muted-foreground">{meta}</span>
                        <span className="ml-auto rounded-full bg-[#22c55e] px-1.5 py-0.5 text-[9px] font-bold text-white">{score}</span>
                      </div>
                      <div className="mt-0.5 font-display text-[11px] font-semibold leading-[1.3] text-gray-900">{title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>

            {/* Float card 2 — bottom right */}
            <div
              className="absolute bottom-25 right-10 z-10 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3.5 lg:flex"
              style={{ boxShadow: "0 20px 40px -10px rgba(17,24,39,0.15), 0 8px 16px -8px rgba(17,24,39,0.1)" }}
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent">
                <ShoppingCart className="size-4.5 text-accent-foreground" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-gray-900">{t.floatCard2Title}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{t.floatCard2Sub}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
