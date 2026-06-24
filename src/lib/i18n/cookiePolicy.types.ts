/**
 * Shape of the structured cookie-policy content stored per locale.
 * EN is canonical; other locales re-export EN until professionally translated.
 * Reuses the privacy-policy block primitives. Consumed by <CookiePolicySection>.
 *
 * Unlike the privacy policy / terms of use, the cookie policy has no "summary"
 * and no table of contents, and its sections are NOT numbered.
 */
import type { PolicyBlock, PolicySection } from "./privacyPolicy.types";

export interface CookiePolicyContent {
  title: string;
  lastUpdated: string;
  intro: PolicyBlock[];
  sections: PolicySection[];
}
