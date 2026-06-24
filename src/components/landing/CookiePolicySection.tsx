import { Info } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { Translations } from "@/lib/i18n/dictionaries";
import type { PolicyBlock, PolicySection } from "@/lib/i18n/privacyPolicy.types";

interface CookiePolicySectionProps {
  content: Translations["cookiePolicy"];
  t: Translations["legal"];
  locale: Locale;
}

const LINK_RE = /(https?:\/\/[^\s)]+|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi;

/** Turn bare emails / URLs in the legal text into teal links. */
function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const isEmail = tok.includes("@");
    const href = isEmail ? `mailto:${tok}` : tok;
    out.push(
      <a
        key={`l${key++}`}
        href={href}
        className="text-primary underline underline-offset-2 transition-colors hover:text-teal-600"
        {...(isEmail ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {tok}
      </a>,
    );
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Block({ block }: { block: PolicyBlock }) {
  switch (block.type) {
    case "p":
      return <p className="mt-4 text-[15px] leading-[1.72] text-muted-foreground">{linkify(block.text)}</p>;
    case "inShort": {
      const rest = block.text.replace(/^In Short:?\s*/i, "");
      return (
        <p className="mt-4 rounded-lg border-l-2 border-primary bg-accent px-5 py-3.5 text-[15px] leading-[1.6] text-accent-foreground">
          <span className="font-semibold">In Short:</span> {linkify(rest)}
        </p>
      );
    }
    case "subheading":
      return (
        <h3 className="mt-8 font-display text-[17px] font-semibold tracking-[-0.2px] text-foreground">
          {block.text}
        </h3>
      );
    case "list":
      return (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-muted-foreground marker:text-primary">
          {block.items.map((it, i) => (
            <li key={i}>{linkify(it)}</li>
          ))}
        </ul>
      );
    case "linkList":
      return (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-[1.65] text-muted-foreground marker:text-primary">
          {block.items.map((it, i) => (
            <li key={i}>
              <a
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 transition-colors hover:text-teal-600"
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={i}
                    className="border border-border bg-secondary px-3.5 py-2.5 text-left font-semibold text-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-border px-3.5 py-2.5 align-top text-muted-foreground">
                      {linkify(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function Blocks({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </>
  );
}

export function CookiePolicySection({ content, t, locale }: CookiePolicySectionProps) {
  const sections: PolicySection[] = content.sections;

  return (
    <main className="bg-background pt-14 pb-24 md:pt-16">
      <div className="mx-auto max-w-[820px] px-8">
        {/* Title */}
        <h1
          className="font-display font-semibold tracking-[-1px] text-foreground"
          style={{ fontSize: "clamp(32px,4.5vw,46px)", lineHeight: 1.08 }}
        >
          {content.title}
        </h1>
        <p className="mt-3 font-mono text-[13px] font-medium text-muted-foreground">
          Last updated {content.lastUpdated}
        </p>

        {/* English-only notice (non-EN locales) */}
        {locale !== "en" && (
          <div className="mt-8 flex items-start gap-3 rounded-[16px] bg-accent px-5 py-4">
            <Info className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-[14px] leading-[1.55] text-accent-foreground">{t.cookieEnglishNotice}</p>
          </div>
        )}

        {/* Intro */}
        <div className="mt-10">
          <Blocks blocks={content.intro} />
        </div>

        {/* Sections (unnumbered) */}
        {sections.map((s, i) => (
          <section key={i} className="scroll-mt-24">
            <h2 className="mt-14 font-display text-[24px] font-semibold tracking-[-0.5px] text-foreground">
              {s.title}
            </h2>
            <Blocks blocks={s.blocks} />
          </section>
        ))}
      </div>
    </main>
  );
}
