import { companySections, type NavSection } from '@/lib/company/sections';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import type { CompanySection } from '@/lib/routes';

/** One cell in the landing feature grid. */
export type LandingFeatureId = CompanySection;

/** Title, one-line description and route of a landing feature. */
export interface LandingFeature extends NavSection {
  lead: string;
}

/** What each product page answers, in one line. */
const LEADS: Readonly<Record<string, string>> = {
  pulse: 'Score 0-100 del último cierre, mes a mes.',
  diagnosis: 'Qué variables sostienen el score y cuáles lo hunden.',
  action: 'Los tres pasos con más puntos de PULSE en juego.',
  detail: 'Un mes abierto entero y la previsión desglosada.',
  signals: 'Baches y caídas del score, con su mes.',
  advisor: 'Producto que encaja, importe y precio.',
  method: 'Cómo se reparte el score en 100 puntos.',
};

/**
 * Surfaces shown in the light landing band: every page of the product nav
 * for the demo company, each with its lead.
 */
export const LANDING_FEATURES: readonly LandingFeature[] = companySections(
  PULSE_DEMO_COMPANY_ID,
).map((section) => ({ ...section, lead: LEADS[section.key] ?? '' }));

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
