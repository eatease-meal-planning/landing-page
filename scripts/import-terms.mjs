/**
 * ONE-TIME IMPORTER (not part of the normal workflow).
 *
 * Converts the termly.io HTML export (terms.txt) into the structured, type-safe
 * content module src/lib/i18n/locales/en/termsOfUse.ts.
 *
 * After this runs, en/termsOfUse.ts is the SOURCE OF TRUTH — edit it directly
 * (and re-export it in other locales). Re-run only if you re-export fresh terms
 * from termly:  node scripts/import-terms.mjs
 *
 * Mirrors scripts/import-privacy-policy.mjs but: (1) detects section headings by
 * termly's `data-custom-class` attribute (heading_1 = section, heading_2 =
 * subheading) rather than tag name — the terms export buries some numbered
 * headings outside <h2>; (2) has no "Summary of key points" section; (3) buffers
 * loose inline runs so no legal text is dropped, and gates on a
 * sentence-containment check before writing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "node-html-parser";

const ROOT = "D:/dev/eatease/landing-page";
const OUT = `${ROOT}/src/lib/i18n/locales/en/termsOfUse.ts`;

let raw = readFileSync(`${ROOT}/terms.txt`, "utf8");
// Cut termly's trailing attribution ("This Terms and Conditions was created using
// Termly's …") + the hidden DSAR link — not part of the legal text.
raw = raw.split("This Terms and Conditions was created using")[0];
raw = raw.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
const root = parse(raw, { comment: false });

const INLINE = new Set(["SPAN", "BDT", "U", "FONT", "STRONG", "EM", "B", "I", "A", "BR", "SUP", "SUB"]);
const collapse = (s) =>
  s.replace(/\s+/g, " ")
    .replace(/\s+([.,;:)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/\s+'/g, " '")
    .trim();

const customClass = (n) =>
  typeof n.getAttribute === "function" ? n.getAttribute("data-custom-class") : undefined;

// Flat ordered stream of blocks: {kind: title|heading_1|heading_2|p|list|table, ...}
const stream = [];
let buf = "";

function flushPara() {
  const text = collapse(buf);
  buf = "";
  if (!text) return;
  stream.push({ kind: "p", text });
}

function listItems(node) {
  const items = [];
  for (const li of node.childNodes) {
    if (li.nodeType === 1 && li.tagName === "LI") {
      let t = "";
      for (const c of li.childNodes) {
        if (c.nodeType === 1 && (c.tagName === "UL" || c.tagName === "OL")) continue;
        t += c.text;
      }
      const clean = collapse(t);
      if (clean) items.push(clean);
      for (const c of li.childNodes) {
        if (c.nodeType === 1 && (c.tagName === "UL" || c.tagName === "OL")) {
          for (const sub of listItems(c)) items.push(sub);
        }
      }
    }
  }
  return items;
}

function tableData(node) {
  const rows = [];
  for (const tr of node.querySelectorAll("tr")) {
    const cells = tr.childNodes
      .filter((n) => n.nodeType === 1 && /^T[DH]$/.test(n.tagName))
      .map((c) => collapse(c.text));
    if (cells.join("")) rows.push(cells);
  }
  if (!rows.length) return null;
  const headers = rows[0];
  return { headers, rows: rows.slice(1) };
}

// Recursively: does this node contain any block-level (non-inline) descendant?
function hasBlockDesc(n) {
  for (const c of n.childNodes) {
    if (c.nodeType !== 1) continue;
    if (["STYLE", "SCRIPT"].includes(c.tagName)) continue;
    if (!INLINE.has(c.tagName)) return true;
    if (hasBlockDesc(c)) return true;
  }
  return false;
}

function walk(node) {
  for (const c of node.childNodes) {
    if (c.nodeType === 3) {
      buf += c.rawText;
      continue;
    }
    if (c.nodeType !== 1) continue;
    const tag = c.tagName;
    if (["STYLE", "SCRIPT"].includes(tag)) continue;

    // termly tags section/sub headings with data-custom-class. Treat them as
    // ATOMIC: classify by the class and never descend (some wrap an inner <h2>,
    // some don't — descending would double-emit or mis-buffer them).
    const cls = customClass(c);
    if (cls === "title" || cls === "heading_1" || cls === "heading_2") {
      flushPara();
      const t = collapse(c.text);
      if (t) stream.push({ kind: cls, text: t });
      continue;
    }

    if (/^H[1-6]$/.test(tag)) {
      // termly's malformed title markup means the document title "TERMS OF USE"
      // surfaces as a bare <h1> (its data-custom-class="title" wrapper is lost in
      // parsing). The only <h1> is the title — map it to "title" (dropped in
      // grouping); every other heading tag is a subheading.
      flushPara();
      const t = collapse(c.text);
      if (t) stream.push({ kind: tag === "H1" ? "title" : "heading_2", text: t });
    } else if (tag === "UL" || tag === "OL") {
      flushPara();
      const items = listItems(c);
      if (items.length) stream.push({ kind: "list", items });
    } else if (tag === "TABLE") {
      flushPara();
      const td = tableData(c);
      if (td) stream.push({ kind: "table", ...td });
    } else if (tag === "DIV" || tag === "P") {
      if (hasBlockDesc(c)) {
        flushPara();
        walk(c);
        flushPara();
      } else {
        flushPara();
        buf += " " + c.text + " ";
        flushPara();
      }
    } else if (INLINE.has(tag)) {
      if (tag !== "BR" && hasBlockDesc(c)) walk(c);
      else buf += tag === "BR" ? " " : " " + c.text + " ";
    } else {
      walk(c);
    }
  }
}

walk(root);
flushPara();

// ── Group the flat stream into intro / sections ────────────────────────────
const content = { title: "Terms of Use", lastUpdated: "", intro: [], tocTitle: "Table of Contents", sections: [] };
let mode = "intro";
let section = null;
const TOC = /^table of contents$/i;
const NUMBERED = /^(\d+)\.\s+(.*)$/;

for (const b of stream) {
  if (b.kind === "title") continue; // "TERMS OF USE" — we use content.title
  if (b.kind === "heading_1" && TOC.test(b.text)) { mode = "toc"; continue; }
  const num = b.kind === "heading_1" ? b.text.match(NUMBERED) : null;
  if (num) { mode = "sections"; section = { title: num[2].trim(), blocks: [] }; content.sections.push(section); continue; }

  const block =
    b.kind === "heading_1" || b.kind === "heading_2" ? { type: "subheading", text: b.text } :
    b.kind === "list" ? { type: "list", items: b.items } :
    b.kind === "table" ? { type: "table", headers: b.headers, rows: b.rows } :
    b.kind === "p" ? { type: "p", text: b.text } : null;
  if (!block) continue;

  if (mode === "intro") {
    const lu = block.type === "p" && block.text.match(/Last updated\s+(.*)/i);
    if (lu) { content.lastUpdated = lu[1].trim(); continue; }
    content.intro.push(block);
  } else if (mode === "toc") { /* derived from sections — drop termly's */ }
  else if (mode === "sections" && section) section.blocks.push(block);
}

// termly often splits one bullet list into several single-item <ul>s — merge them.
function mergeLists(blocks) {
  const out = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.type === "list" && last && last.type === "list") last.items = last.items.concat(b.items);
    else out.push(b);
  }
  return out;
}
content.intro = mergeLists(content.intro);
content.sections.forEach((s) => (s.blocks = mergeLists(s.blocks)));

// ── Completeness gate: every source sentence must survive (whitespace-insensitive) ──
const norm = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ").toLowerCase().replace(/[^a-z]/g, "");
let sourceText = raw.replace(/<[^>]+>/g, " ");
sourceText = sourceText.replace(/TERMS OF USE/i, " ").replace(/Last updated/i, " ");
// Cut termly's standalone TABLE OF CONTENTS list (we derive the TOC from sections).
const tocStart = sourceText.indexOf("TABLE OF CONTENTS");
const bodyStart = tocStart === -1 ? -1 : sourceText.indexOf("1. OUR SERVICES", tocStart + "TABLE OF CONTENTS".length);
if (tocStart !== -1 && bodyStart !== -1) {
  sourceText = sourceText.slice(0, tocStart) + " " + sourceText.slice(bodyStart);
}

function blocksText(blocks) {
  const parts = [];
  for (const b of blocks) {
    if (b.text) parts.push(b.text);
    if (b.items) parts.push(b.items.join(" "));
    if (b.headers) parts.push(b.headers.join(" "));
    if (b.rows) parts.push(b.rows.map((r) => r.join(" ")).join(" "));
  }
  return parts.join(" ");
}
const generatedText = [
  content.title, content.lastUpdated,
  blocksText(content.intro),
  ...content.sections.flatMap((s) => [s.title, blocksText(s.blocks)]),
].join(" ");
const genNorm = norm(generatedText);

const sentences = sourceText
  .replace(/&amp;/g, "&")
  .split(/(?<=[.?!])\s+|\n/)
  .map((s) => s.trim())
  .filter((s) => s.replace(/[^a-z0-9]/gi, "").length >= 25);

const misses = [];
for (const s of sentences) {
  const n = norm(s);
  if (n.length >= 20 && !genNorm.includes(n)) misses.push(s);
}

console.log(`Sections: ${content.sections.length} | intro blocks: ${content.intro.length}`);
console.log(`lastUpdated: ${content.lastUpdated}`);
console.log(`Sentences checked: ${sentences.length} | misses: ${misses.length}`);
if (misses.length) {
  console.log("\n⚠ MISSING SENTENCES (first 12):");
  misses.slice(0, 12).forEach((m) => console.log("  · " + m.slice(0, 140)));
  console.log("\nNOT writing output — completeness gate failed.");
  process.exit(1);
}

const ts = `import type { TermsOfUseContent } from "../../termsOfUse.types";

// AUTO-IMPORTED from terms.txt (termly export) — now the source of truth.
// Edit directly; see scripts/import-terms.mjs to re-import.
export const termsOfUse: TermsOfUseContent = ${JSON.stringify(content, null, 2)};
`;
writeFileSync(OUT, ts, "utf8");
console.log(`\n✓ Wrote ${OUT}`);
