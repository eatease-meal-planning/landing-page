/**
 * Shape of the structured terms-of-use content stored per locale.
 * EN is canonical; other locales re-export EN until professionally translated.
 * Reuses the privacy-policy block primitives. Consumed by <TermsOfUseSection>.
 */
import type { PolicyBlock, PolicySection } from "./privacyPolicy.types";

export interface TermsOfUseContent {
  title: string;
  lastUpdated: string;
  intro: PolicyBlock[];
  tocTitle: string;
  /** Table of contents is DERIVED from `sections` in the component. */
  sections: PolicySection[];
}
