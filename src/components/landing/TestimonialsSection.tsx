import type { Translations } from "@/lib/i18n/dictionaries";

interface TestimonialsProps {
  t: Translations["testimonials"];
}

export function TestimonialsSection({ t }: TestimonialsProps) {
  const quotes = [t.q1, t.q2, t.q3];

  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-[1240px] px-8">
        <p className="mb-3.5 text-[12px] font-semibold uppercase tracking-[1.2px] text-accent-foreground">
          {t.eyebrow}
        </p>
        <h2
          className="font-display font-semibold text-gray-900"
          style={{ fontSize: "clamp(32px,4vw,52px)", lineHeight: 1.05, letterSpacing: "-1px" }}
        >
          {t.title}
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <div
              key={i}
              className="rounded-[18px] border border-border bg-white p-8 shadow-sm"
            >
              <div className="mb-3.5 text-[14px] tracking-[2px] text-primary">★★★★★</div>
              <p className="mb-5 font-display text-[17px] leading-[1.5] tracking-[-0.25px] text-gray-800">
                {q.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-gray-100 font-display text-sm font-semibold text-gray-700">
                  {q.name.split(" ").map((w) => w[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{q.name}</div>
                  <div className="text-[12px] text-muted-foreground">{q.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
