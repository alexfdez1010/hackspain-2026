import type { PulseSignalKind } from '@/lib/pulse/types';

/** One variable of the diagnosis notice, with the score that tints it. */
export interface DiagnosisVariablePreview {
  label: string;
  score: number;
}

/** Compact diagnosis snapshot: the drivers and one sentence of what they do. */
export interface DiagnosisPreview {
  notice: string;
  variables: readonly DiagnosisVariablePreview[];
}

/** One open signal, shaped like the product alert. */
export interface SignalPreview {
  kind: PulseSignalKind;
  month: string;
  lastMonth: string;
  headline: string;
  detail: string;
  status: string;
}

/** Financing snapshot: an approved amount and the pillar it would move. */
export interface FinancingPreview {
  amount: number;
  product: string;
  pillar: string;
  current: number;
  target: number;
}

/**
 * Marketing diagnosis: cobros in the worst bands, as the mosaic would tint
 * them. Scores are fixed so the notice does not drift between visits.
 */
export const DIAGNOSIS_PREVIEW: DiagnosisPreview = {
  notice: 'Los cobros tardan y restan al PULSE de este mes.',
  variables: [
    { label: 'Días de cobro', score: 22.4 },
    { label: 'Cartera a más de 90 días', score: 28.1 },
    { label: 'Vencimientos', score: 41.6 },
  ],
};

/**
 * Marketing alert: a bache on the last close of the PULSE trajectory.
 */
export const SIGNAL_PREVIEW: SignalPreview = {
  kind: 'bache',
  month: '2026-08',
  lastMonth: '2026-08',
  headline: 'El DSO empeoró 8 puntos en un mes.',
  detail: 'Los cobros se alargan y el margen de caja se estrecha.',
  status: 'abierta, 71 % de que dure',
};

/**
 * Marketing financing: a working-capital line and the liquidity move it
 * prices. The scores sit on the same 0-100 scale as the financing pillar shift.
 */
export const FINANCING_PREVIEW: FinancingPreview = {
  amount: 180_000,
  product: 'Línea de circulante',
  pillar: 'Liquidez',
  current: 34,
  target: 60,
};
