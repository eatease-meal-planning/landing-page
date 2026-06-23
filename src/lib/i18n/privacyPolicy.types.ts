/**
 * Shape of the structured privacy-policy content stored per locale.
 * EN is canonical; other locales re-export EN until professionally translated.
 * Consumed by <PrivacyPolicySection>.
 */
export type PolicyBlock =
  | { type: "p"; text: string }
  | { type: "inShort"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface PolicySection {
  /** Section title WITHOUT the leading number — the component owns numbering. */
  title: string;
  blocks: PolicyBlock[];
}

export interface PrivacyPolicyContent {
  title: string;
  lastUpdated: string;
  intro: PolicyBlock[];
  summaryTitle: string;
  summary: PolicyBlock[];
  tocTitle: string;
  /** Table of contents is DERIVED from `sections` in the component. */
  sections: PolicySection[];
}
