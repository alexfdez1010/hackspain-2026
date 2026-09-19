/** Identifiers of the four landing feature cells, in reading order. */
export const LANDING_FEATURE_IDS = [
  'pulse',
  'forecast',
  'advisor',
  'method',
] as const;

/** One cell in the landing 2×2. */
export type LandingFeatureId = (typeof LANDING_FEATURE_IDS)[number];

/** Title and one-line description of a landing feature. */
export interface LandingFeature {
  id: LandingFeatureId;
  label: string;
  lead: string;
}

/**
 * Surfaces shown in the light landing band.
 *
 * Order is reading order: PULSE, Previsión, Recomendaciones, Método.
 */
export const LANDING_FEATURES: readonly LandingFeature[] = [
  {
    id: 'pulse',
    label: 'PULSE',
    lead: 'Score 0-100 del último cierre, mes a mes.',
  },
  {
    id: 'forecast',
    label: 'Previsión',
    lead: 'Seis meses adelante; observado frente a previsto.',
  },
  {
    id: 'advisor',
    label: 'Recomendaciones',
    lead: 'Producto que encaja, importe y precio.',
  },
  {
    id: 'method',
    label: 'Método',
    lead: 'Cómo se reparte el score en 100 puntos.',
  },
];

/**
 * Feature for a cell id, or PULSE when the id is unknown.
 *
 * @param id - Requested cell.
 * @returns The matching catalogue row.
 */
export function landingFeature(id: string): LandingFeature {
  return (
    LANDING_FEATURES.find((feature) => feature.id === id) ?? LANDING_FEATURES[0]
  );
}

/**
 * Which preview the left pane shows for a 2×2 cell.
 *
 * PULSE has the animated marketing trajectory; the other three keep the
 * product chart until they get their own preview.
 *
 * @param id - Selected cell.
 * @returns `pulse-animation` for PULSE, otherwise `chart`.
 */
export function landingPreview(
  id: LandingFeatureId,
): 'pulse-animation' | 'chart' {
  return id === 'pulse' ? 'pulse-animation' : 'chart';
}
