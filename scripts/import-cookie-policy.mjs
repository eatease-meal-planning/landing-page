/**
 * ONE-TIME IMPORTER (not part of the normal workflow).
 *
 * Converts the termly.io HTML export (cookie-policy.txt) into the structured,
 * type-safe content module src/lib/i18n/locales/en/cookiePolicy.ts.
 *
 * After this runs, en/cookiePolicy.ts is the SOURCE OF TRUTH — edit it directly
 * (and re-export it in other locales). Re-run only if you re-export a fresh
 * cookie policy from termly:  node scripts/import-cookie-policy.mjs
 *
 * Mirrors scripts/import-terms.mjs but the cookie policy is SIMPLER: no
 * "Summary of key points", no "Table of contents", and its sections are NOT
 * numbered. Grouping is therefore: intro until the first `heading_1`, then each
 * `heading_1` starts a new (unnumbered) section; `heading_2` → subheading. The
 * `data-custom-class` atomic-heading detection is identical to terms.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parse } from "node-html-parser";

const ROOT = "D:/dev/eatease/landing-page";
const OUT = `${ROOT}/src/lib/i18n/locales/en/cookiePolicy.ts`;

// Legal entity name — termly exported the company-name fields blank ("__________").
const COMPANY = "Ricardo Jorge Pinto da Silva Rato, empresário em nome individual";

let raw = readFileSync(`${ROOT}/cookie-policy.txt`, "utf8");
raw = raw.split("__________").join(COMPANY);
// Cut termly's trailing attribution ("This Cookie Policy was created using
// Termly's …") — not part of the legal text.
raw = raw.split("This Cookie Policy was created using")[0];
// Drop the hidden DSAR anchor block (display:none, no visible text).
raw = raw.replace(/<div style="display: none;">[\s\S]*?<\/div>/gi, "");
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

// Returns rich items {label, href?}. The cookie policy's browser- and
// ad-network lists are anchors; we preserve their hrefs so the links survive.
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
      const a = typeof li.querySelector === "function" ? li.querySelector("a") : null;
      const href = a && typeof a.getAttribute === "function" ? a.getAttribute("href") : null;
      if (clean) items.push(href ? { label: clean, href } : { label: clean });
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
    // ATOMIC: classify by the class and never descend.
    const cls = customClass(c);
    if (cls === "title" || cls === "heading_1" || cls === "heading_2") {
      flushPara();
      const t = collapse(c.text);
      if (t) stream.push({ kind: cls, text: t });
      continue;
    }

    if (/^H[1-6]$/.test(tag)) {
      flushPara();
      const t = collapse(c.text);
      if (t) stream.push({ kind: tag === "H1" ? "title" : "heading_2", text: t });
    } else if (tag === "UL" || tag === "OL") {
      flushPara();
      const items = listItems(c);
      if (items.length) {
        // If every item is an anchor, keep it as a typed link list; otherwise a
        // plain bullet list (labels only).
        if (items.every((it) => it.href)) stream.push({ kind: "linkList", items });
        else stream.push({ kind: "list", items: items.map((it) => it.label) });
      }
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

// ── Group the flat stream into intro / (unnumbered) sections ────────────────
const content = { title: "Cookie Policy", lastUpdated: "", intro: [], sections: [] };
let mode = "intro";
let section = null;

for (const b of stream) {
  if (b.kind === "title") continue; // "COOKIE POLICY" — we use content.title
  if (b.kind === "heading_1") {
    mode = "sections";
    section = { title: b.text, blocks: [] };
    content.sections.push(section);
    continue;
  }

  const block =
    b.kind === "heading_2" ? { type: "subheading", text: b.text } :
    b.kind === "list" ? { type: "list", items: b.items } :
    b.kind === "linkList" ? { type: "linkList", items: b.items } :
    b.kind === "table" ? { type: "table", headers: b.headers, rows: b.rows } :
    b.kind === "p" ? { type: "p", text: b.text } : null;
  if (!block) continue;

  if (mode === "intro") {
    const lu = block.type === "p" && block.text.match(/Last updated\s+(.*)/i);
    if (lu) { content.lastUpdated = lu[1].trim(); continue; }
    content.intro.push(block);
  } else if (mode === "sections" && section) section.blocks.push(block);
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
sourceText = sourceText.replace(/COOKIE POLICY/i, " ").replace(/Last updated/i, " ");

function blocksText(blocks) {
  const parts = [];
  for (const b of blocks) {
    if (b.text) parts.push(b.text);
    // Labels only — hrefs aren't present in the tag-stripped source text, so
    // including them here would break the contiguous-substring match.
    if (b.items) parts.push(b.items.map((it) => (typeof it === "string" ? it : it.label)).join(" "));
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

const ts = `import type { CookiePolicyContent } from "../../cookiePolicy.types";

// AUTO-IMPORTED from cookie-policy.txt (termly export) — now the source of truth.
// Edit directly; see scripts/import-cookie-policy.mjs to re-import.
export const cookiePolicy: CookiePolicyContent = ${JSON.stringify(content, null, 2)};
`;
writeFileSync(OUT, ts, "utf8");
console.log(`\n✓ Wrote ${OUT}`);
