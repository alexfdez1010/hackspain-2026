import type { Direction, Regime } from '@/lib/xray/types';

/** Identifier of a score band. */
export type ScoreBandKey = 'critical' | 'fragile' | 'neutral' | 'solid';

/** Visual and textual description of a score band. */
export interface ScoreBand {
  key: ScoreBandKey;
  /** Spanish label used in filters and legends. */
  label: string;
  /** Inclusive lower bound of the band. */
  min: number;
  /** Exclusive upper bound of the band. */
  max: number;
  /** CSS custom property holding the band colour, for SVG fills and strokes. */
  color: string;
  /** Tailwind text colour utility. */
  textClass: string;
  /** Tailwind background utility for chips and swatches. */
  bgClass: string;
}

/** The four score bands, ordered from worst to best. */
export const SCORE_BANDS: readonly ScoreBand[] = [
  {
    key: 'critical',
    label: 'Crítico (<35)',
    min: Number.NEGATIVE_INFINITY,
    max: 35,
    color: 'var(--score-critical)',
    textClass: 'text-[var(--score-critical)]',
    bgClass: 'bg-[var(--score-critical)]',
  },
  {
    key: 'fragile',
    label: 'Frágil (35-50)',
    min: 35,
    max: 50,
    color: 'var(--score-fragile)',
    textClass: 'text-[var(--score-fragile)]',
    bgClass: 'bg-[var(--score-fragile)]',
  },
  {
    key: 'neutral',
    label: 'Neutro (50-65)',
    min: 50,
    max: 65,
    color: 'var(--score-neutral)',
    textClass: 'text-[var(--score-neutral)]',
    bgClass: 'bg-[var(--score-neutral)]',
  },
  {
    key: 'solid',
    label: 'Sólido (>65)',
    min: 65,
    max: Number.POSITIVE_INFINITY,
    color: 'var(--score-solid)',
    textClass: 'text-[var(--score-solid)]',
    bgClass: 'bg-[var(--score-solid)]',
  },
];

/**
 * Maps a score to its band. Bands are half-open: `[min, max)`.
 *
 * @param score - Score in the 0-100 range; `null` falls back to the neutral band.
 * @returns The matching band descriptor.
 */
export function scoreBand(score: number | null): ScoreBand {
  if (score === null || !Number.isFinite(score)) return SCORE_BANDS[2];
  return (
    SCORE_BANDS.find((band) => score >= band.min && score < band.max) ??
    SCORE_BANDS[3]
  );
}

/**
 * Resolves the colour of a score for SVG attributes.
 *
 * @param score - Score in the 0-100 range.
 * @returns A CSS colour expression.
 */
export function scoreColor(score: number | null): string {
  return scoreBand(score).color;
}

/** Spanish labels for the trajectory directions. */
export const DIRECTION_LABELS: Record<Direction, string> = {
  improving: 'Mejorando',
  stable: 'Estable',
  deteriorating: 'Deteriorándose',
};

/** Spanish labels for the detected regimes. */
export const REGIME_LABELS: Record<Regime, string> = {
  steady: 'Estable',
  structural_decline: 'Caída estructural',
  structural_improvement: 'Mejora estructural',
  transient_dip: 'Bache pasajero',
  transient_spike: 'Repunte pasajero',
};

/** Short explanation of what each regime means for a risk decision. */
export const REGIME_HINTS: Record<Regime, string> = {
  steady: 'Sin cambio de nivel detectado en los últimos 24 meses.',
  structural_decline: 'Cambio de nivel a la baja: el deterioro no revierte.',
  structural_improvement: 'Cambio de nivel al alza sostenido tras el corte.',
  transient_dip: 'Caída puntual que el score ya ha recuperado.',
  transient_spike: 'Repunte puntual que no se ha consolidado.',
};

/**
 * Maps a direction to the HeroUI semantic colour used by chips.
 *
 * @param direction - Trajectory direction.
 * @returns A HeroUI colour name.
 */
export function directionColor(
  direction: Direction,
): 'success' | 'default' | 'danger' {
  if (direction === 'improving') return 'success';
  if (direction === 'deteriorating') return 'danger';
  return 'default';
}

/**
 * Maps a regime to the HeroUI semantic colour used by chips.
 *
 * @param regime - Detected regime.
 * @returns A HeroUI colour name.
 */
export function regimeColor(
  regime: Regime,
): 'success' | 'default' | 'danger' | 'warning' {
  if (regime === 'structural_decline') return 'danger';
  if (regime === 'structural_improvement') return 'success';
  if (regime === 'transient_dip') return 'warning';
  return 'default';
}
