import { companySections, type NavSection } from '@/lib/company/sections';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import type { CompanySection } from '@/lib/routes';
import { SCORE_BANDS, type ScoreBandKey } from '@/lib/score';

/** One cell in the landing feature grid. */
export type LandingFeatureId = CompanySection;

/** Title, two-line description and route of a landing feature. */
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

/** What each shown page answers, in two sentences. */
const LEADS: Readonly<Record<string, string>> = {
  pulse:
    'Cuánta caja puedes usar hoy y hasta cuándo, sin comprometer tus pagos. El cierre, la previsión y la banda de incertidumbre, en una sola lectura.',
  diagnosis:
    'Qué cobros, pagos y vencimientos explican tu margen de seguridad. Cada variable con su peso, su score y lo que mueve el PULSE de este mes.',
  signals:
    'Qué cambio reduce ese margen y acerca una posible tensión de caja. La fecha, la magnitud y si el movimiento se confirma o se corrige.',
  advisor:
    'Qué facturas puedes adelantar para convertir caja ociosa en ahorro. El encaje de cada producto con tu PULSE de hoy, y lo que queda fuera de alcance.',
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

/**
 * Score band of a landing cell, in reading order: the four pages sit on
 * the four sparkles, worst band first. Unknown ids fall back to Crítico.
 *
 * @param id - Cell identifier.
 * @returns The matching band key.
 */
export function featureBand(id: string): ScoreBandKey {
  const index = LANDING_FEATURE_KEYS.indexOf(id as CompanySection);
  return SCORE_BANDS[index]?.key ?? SCORE_BANDS[0].key;
}

/**
 * Landing cell of a score band, the inverse of {@link featureBand}.
 * Unknown bands fall back to PULSE.
 *
 * @param band - Score level.
 * @returns The matching cell id.
 */
export function bandFeature(band: string): LandingFeatureId {
  const index = SCORE_BANDS.findIndex((level) => level.key === band);
  return LANDING_FEATURE_KEYS[index] ?? LANDING_FEATURE_KEYS[0];
}
