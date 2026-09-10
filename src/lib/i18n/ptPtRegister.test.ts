import { describe, expect, it } from "vitest";
import { en } from "./locales/en/index";
import { ptPt } from "./locales/pt-pt/index";

/**
 * European Portuguese has two ways of addressing the reader, and the whole site
 * is written in one of them: `tu`. The app is too. `deleteAccount.ts` was the
 * single file written in `você` — a formal register that reads, in pt-PT, like
 * a bank letter — and the split ran right through one sentence in
 * `pages.linkExpired` ("Volta ao início e submete o seu email").
 *
 * This is a tripwire, not a proof. A regex cannot decide whether "as suas
 * refeições" addresses the reader or a third party, so the possessive rule
 * skips `aboutUs`, whose two uses mean "their" and "its". What the test does
 * catch is every unambiguous marker of formal address, which is what actually
 * drifts when a file is written in isolation.
 */

/** Formal address, with no informal reading available. */
const FORMAL = [
  // Pronouns and the dative clitic. `\b` keeps "detalhe" and "escolhe" out.
  /\bvocês?\b/i,
  /\blhes?\b/i,
  /-lhes?\b/i,
  // Third-person imperatives — the formal command form.
  /\b(indique|aguarde|verifique|complete|tente|leia|escreva|diga-nos|precisa de)\b/i,
];

/** Formal possessives. `aboutUs` is exempt — see the header. */
const FORMAL_POSSESSIVE = /\b([oa] su[ao]|[oa]s su[ao]s)\b/i;

/**
 * pt-pt has no translation of the three legal documents: its barrel re-exports
 * the *same objects* from `en` (`locales/pt-pt/index.ts`). Those subtrees are
 * English prose, where "complete" is an adjective and not a formal imperative,
 * so neither rule can say anything about them. Identity is the test — a real
 * pt-pt translation would be a different object, and would be checked.
 */
function isEnglishFallback(section: string) {
  return (ptPt as Record<string, unknown>)[section] === (en as Record<string, unknown>)[section];
}

/** Every translated pt-pt string, addressed by its dotted path. */
function* translatedStrings(): Generator<[string, string]> {
  for (const [section, node] of Object.entries(ptPt)) {
    if (isEnglishFallback(section)) continue;
    yield* walk(node, section);
  }
}

function* walk(node: unknown, path: string): Generator<[string, string]> {
  if (typeof node === "string") {
    yield [path, node];
  } else if (Array.isArray(node)) {
    for (const [i, child] of node.entries()) yield* walk(child, `${path}[${i}]`);
  } else if (node && typeof node === "object") {
    for (const [key, child] of Object.entries(node)) yield* walk(child, `${path}.${key}`);
  }
}

describe("pt-pt addresses the reader as `tu`, like the rest of the site and the app", () => {
  it("uses no formal pronoun, clitic or imperative", () => {
    for (const [path, value] of translatedStrings()) {
      for (const marker of FORMAL) {
        expect(marker.test(value), `${path} is formal (${marker}): ${value}`).toBe(false);
      }
    }
  });

  it("uses no formal possessive outside `aboutUs`", () => {
    for (const [path, value] of translatedStrings()) {
      if (path.startsWith("aboutUs")) continue;
      expect(FORMAL_POSSESSIVE.test(value), `${path} is formal: ${value}`).toBe(false);
    }
  });

  it("still inspects something — a dictionary that stopped resolving must fail, not pass empty", () => {
    expect([...translatedStrings()].length).toBeGreaterThan(100);
  });
});
