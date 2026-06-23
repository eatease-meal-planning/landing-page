/**
 * ONE-TIME IMPORTER (not part of the normal workflow).
 *
 * Converts the termly.io HTML export (privacy-policy.txt) into the structured,
 * type-safe content module src/lib/i18n/locales/en/privacyPolicy.ts.
 *
 * After this runs, en/privacyPolicy.ts is the SOURCE OF TRUTH — edit it directly
 * (and add translated copies in other locales). Re-run only if you re-export a
 * fresh policy from termly:  node scripts/import-privacy-policy.mjs
 *
 * It buffers loose inline runs between block elements (termly leaves the
 * "In Short:" callouts and some bodies unwrapped) so no legal text is dropped,
 * and gates on a sentence-containment check before writing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "node-html-parser";

const ROOT = "D:/dev/eatease/landing-page";
const OUT = `${ROOT}/src/lib/i18n/locales/en/privacyPolicy.ts`;

let raw = readFileSync(`${ROOT}/privacy-policy.txt`, "utf8");
raw = raw.split("greenlink privacy policy:")[0];
raw = raw.replace(/^privacy-policy:\s*/i, "").trim().replace(/^"/, "").replace(/"\s*$/, "");
raw = raw.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
const root = parse(raw, { comment: false });

const INLINE = new Set(["SPAN", "BDT", "U", "FONT", "STRONG", "EM", "B", "I", "A", "BR", "SUP", "SUB"]);
const collapse = (s) =>
  s.replace(/\s+/g, " ")
    .replace(/\s+([.,;:)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/\s+'/g, " '")
    .trim();

// Flat ordered stream of blocks: {kind: h1|h2|h3|p|list|table, ...}
const stream = [];
let buf = "";

function flushPara() {
  const text = collapse(buf);
  buf = "";
  if (!text) return;
  if (/^In Short:?/i.test(text)) stream.push({ kind: "inShort", text });
  else stream.push({ kind: "p", text });
}

function listItems(node) {
  const items = [];
  for (const li of node.childNodes) {
    if (li.nodeType === 1 && li.tagName === "LI") {
      // text of the LI excluding nested <ul>/<ol> (those become their own items)
      let t = "";
      for (const c of li.childNodes) {
        if (c.nodeType === 1 && (c.tagName === "UL" || c.tagName === "OL")) continue;
        t += c.text;
      }
      const clean = collapse(t);
      if (clean) items.push(clean);
      // flatten nested lists into the same array (prefixed)
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

    if (/^H[1-6]$/.test(tag)) {
      flushPara();
      const t = collapse(c.text);
      if (t) stream.push({ kind: tag.toLowerCase(), text: t });
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
      // Inline wrappers that actually enclose block content (termly buries
      // headings inside <strong><span>) must be descended into, not buffered.
      if (tag !== "BR" && hasBlockDesc(c)) walk(c);
      else buf += tag === "BR" ? " " : " " + c.text + " ";
    } else {
      walk(c);
    }
  }
}

walk(root);
flushPara();

// ── Group the flat stream into intro / summary / sections ──────────────────
const content = { title: "Privacy Policy", lastUpdated: "", intro: [], summaryTitle: "", summary: [], tocTitle: "Table of Contents", sections: [] };
let mode = "intro";
let section = null;
const SUMMARY = /summary of key points/i;
const TOC = /table of contents/i;
const NUMBERED = /^(\d+)\.\s+(.*)$/;

for (const b of stream) {
  if (b.kind === "h1") continue; // "PRIVACY POLICY" — we use content.title
  if (b.kind === "h2" && SUMMARY.test(b.text)) { mode = "summary"; content.summaryTitle = collapse(b.text); continue; }
  if (b.kind === "h2" && TOC.test(b.text)) { mode = "toc"; continue; }
  const num = b.kind === "h2" ? b.text.match(NUMBERED) : null;
  if (num) { mode = "sections"; section = { title: num[2].trim(), blocks: [] }; content.sections.push(section); continue; }

  const block =
    b.kind === "h3" ? { type: "subheading", text: b.text } :
    b.kind === "list" ? { type: "list", items: b.items } :
    b.kind === "table" ? { type: "table", headers: b.headers, rows: b.rows } :
    b.kind === "inShort" ? { type: "inShort", text: b.text } :
    b.kind === "p" ? { type: "p", text: b.text } : null;
  if (!block) continue;

  if (mode === "intro") {
    const lu = block.type === "p" && block.text.match(/Last updated\s+(.*)/i);
    if (lu) { content.lastUpdated = lu[1].trim(); continue; }
    content.intro.push(block);
  } else if (mode === "summary") content.summary.push(block);
  else if (mode === "toc") { /* derived from sections — drop termly's */ }
  else if (mode === "sections" && section) section.blocks.push(block);
}

// termly exports the "Categories of Personal Information" table broken: only rows
// A and B are real <table>s, C–L come out as loose paragraph triples
// (name / examples / NO-YES). Reassemble them into one clean table.
function consolidateCategoryTable(blocks) {
  const ti = blocks.findIndex(
    (b) => b.type === "table" && b.headers[0] === "Category" && b.headers[1] === "Examples" && b.headers[2] === "Collected"
  );
  if (ti === -1) return blocks;
  const headers = blocks[ti].headers;
  const rows = [...blocks[ti].rows]; // row A
  const isVal = (t) => /^(no|yes)$/i.test(t.trim());
  let j = ti + 1;
  while (j < blocks.length) {
    const b = blocks[j];
    if (b.type === "table" && b.rows.length === 0 && b.headers.length === 3) {
      rows.push(b.headers); // row B arrived as a stray 1-row table
      j++;
      continue;
    }
    if (b.type === "p" && /^[A-Z]\.\s/.test(b.text)) {
      let name = b.text.trim();
      const examples = [];
      let value = "";
      let k = j + 1;
      while (k < blocks.length && blocks[k].type === "p") {
        const t = blocks[k].text.trim();
        if (isVal(t)) { value = t.toUpperCase(); k++; break; }
        examples.push(t);
        k++;
      }
      let ex = examples.join(" ");
      // termly merged row L's name + examples into one paragraph — split it.
      if (!ex) {
        const m = name.match(/^(L\. Sensitive personal Information)\s+(.+)$/i);
        if (m) { name = m[1]; ex = m[2]; }
      }
      rows.push([name, ex, value]);
      j = k;
      continue;
    }
    break; // reached non-category content
  }
  return [...blocks.slice(0, ti), { type: "table", headers, rows }, ...blocks.slice(j)];
}
content.sections.forEach((s) => (s.blocks = consolidateCategoryTable(s.blocks)));

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
content.summary = mergeLists(content.summary);
content.sections.forEach((s) => (s.blocks = mergeLists(s.blocks)));

// ── Completeness gate: every source sentence must survive (whitespace-insensitive) ──
// Digits are stripped on BOTH sides so intentional reordering of section numbers
// (we derive the TOC/numbering) doesn't read as a drop.
const norm = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&[a-z]+;/g, " ").toLowerCase().replace(/[^a-z]/g, "");
let sourceText = raw.replace(/<[^>]+>/g, " ");
// Remove the title line and the "Last updated" label (kept structurally, not as body text).
sourceText = sourceText.replace(/PRIVACY POLICY/i, " ").replace(/Last updated/i, " ");
// Cut termly's standalone TABLE OF CONTENTS list (we derive the TOC from sections).
// The list runs from "TABLE OF CONTENTS" until the body's first subsection heading,
// which never appears in the TOC.
// Case-sensitive: the heading is "TABLE OF CONTENTS" (uppercase); the summary
// mentions lowercase "table of contents below" earlier, which must not match.
const tocStart = sourceText.indexOf("TABLE OF CONTENTS");
// case-sensitive, searched AFTER the TOC (the summary mentions the lowercase
// "personal information you disclose to us" earlier, which we must skip).
const bodyStart = tocStart === -1 ? -1 : sourceText.indexOf("Personal information you disclose to us", tocStart);
if (tocStart !== -1 && bodyStart !== -1) {
  sourceText = sourceText.slice(0, tocStart) + " " + sourceText.slice(bodyStart);
}
// Concatenate only the TEXT VALUES, in document order (no JSON keys, which would
// pollute the stream and break substring matching across block boundaries).
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
  content.summaryTitle, blocksText(content.summary),
  ...content.sections.flatMap((s) => [s.title, blocksText(s.blocks)]),
].join(" ");
const genNorm = norm(generatedText);

const sentences = sourceText
  .replace(/&amp;/g, "&")
  .split(/(?<=[.?!])\s+|\n/)
  .map((s) => s.trim())
  .filter((s) => s.replace(/[^a-z0-9]/gi, "").length >= 25); // ignore tiny fragments

const misses = [];
for (const s of sentences) {
  const n = norm(s);
  if (n.length >= 20 && !genNorm.includes(n)) misses.push(s);
}

console.log(`Sections: ${content.sections.length} | intro blocks: ${content.intro.length} | summary blocks: ${content.summary.length}`);
console.log(`lastUpdated: ${content.lastUpdated}`);
console.log(`Sentences checked: ${sentences.length} | misses: ${misses.length}`);
if (misses.length) {
  console.log("\n⚠ MISSING SENTENCES (first 12):");
  misses.slice(0, 12).forEach((m) => console.log("  · " + m.slice(0, 140)));
  console.log("\nNOT writing output — completeness gate failed.");
  process.exit(1);
}

const ts = `import type { PrivacyPolicyContent } from "../../privacyPolicy.types";

// AUTO-IMPORTED from privacy-policy.txt (termly export) — now the source of truth.
// Edit directly; see scripts/import-privacy-policy.mjs to re-import.
export const privacyPolicy: PrivacyPolicyContent = ${JSON.stringify(content, null, 2)};
`;
writeFileSync(OUT, ts, "utf8");
console.log(`\n✓ Wrote ${OUT}`);
