import { companySections, type NavSection } from '@/lib/company/sections';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import type { CompanySection } from '@/lib/routes';

/** One cell in the landing feature grid. */
export type LandingFeatureId = CompanySection;

/** Title, one-line description and route of a landing feature. */
export interface LandingFeature extends NavSection {
  lead: string;
}

/**
 * Pages shown in the light landing band, in reading order: one per cell of
 * the 2×2, so each sits on one of the four sparkles and its score level.
 */
export const LANDING_FEATURE_KEYS: readonly CompanySection[] = [
  'pulse',
  'diagnosis',
  'signals',
  'advisor',
];

/** What each shown page answers, in one line. */
const LEADS: Readonly<Record<string, string>> = {
  pulse: 'Score 0-100 del último cierre, mes a mes.',
  diagnosis: 'Qué variables sostienen el score y cuáles lo hunden.',
  signals: 'Baches y caídas del score, con su mes.',
  advisor: 'Producto que encaja, importe y precio.',
};

/**
 * Surfaces shown in the light landing band: the four pages of
 * {@link LANDING_FEATURE_KEYS} for the demo company, each with its lead. The
 * rows come from the product nav so labels and routes cannot drift.
 */
export const LANDING_FEATURES: readonly LandingFeature[] = companySections(
  PULSE_DEMO_COMPANY_ID,
)
  .filter((section) => LANDING_FEATURE_KEYS.includes(section.key))
  .map((section) => ({ ...section, lead: LEADS[section.key] ?? '' }));

/** Identifiers of the landing feature cells, in reading order. */
export const LANDING_FEATURE_IDS: readonly LandingFeatureId[] =
  LANDING_FEATURES.map((feature) => feature.key);

/**
 * Feature for a cell id, or PULSE when the id is unknown.
 *
 * @param id - Requested cell.
 * @returns The matching catalogue row.
 */
export function landingFeature(id: string): LandingFeature {
  return (
    LANDING_FEATURES.find((feature) => feature.key === id) ??
    LANDING_FEATURES[0]
  );
}
