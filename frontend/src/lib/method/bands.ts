import { SCORE_BANDS, type ScoreBandKey } from '@/lib/score';

/** One band of the score placed on the 0-100 scale. */
export interface MethodBandSpan {
  key: ScoreBandKey;
  /** Band name without the range, such as `Crítico`. */
  name: string;
  /** Range in the notation of the specification, such as `35-50`. */
  range: string;
  /** Lower edge inside the drawn scale. */
  from: number;
  /** Upper edge inside the drawn scale. */
  to: number;
  /** Share of the scale the band covers, in percent. */
  width: number;
  /** CSS colour of the band. */
  color: string;
  /** What being in the band means, in everyday words. */
  meaning: string;
}

/** What each band means for the company, in one plain sentence. */
export const BAND_MEANINGS: Readonly<Record<ScoreBandKey, string>> = {
  critical:
    'Hay problemas ya: falta dinero en el banco o hay deudas que aprietan.',
  fragile: 'Aguanta, pero con poco margen: un mes malo le hace daño.',
  neutral: 'Va bien, sin que sobre ni falte.',
  solid:
    'Sobra tranquilidad: dinero en el banco, deudas a raya y clientes que pagan.',
};

/**
 * Places the four score bands on the drawn scale.
 *
 * The open bands are clipped to the ends of the scale, so the widths add up to
 * the full bar and a band cannot be read as wider than the range it covers.
 *
 * @param min - Lower end of the drawn scale.
 * @param max - Upper end of the drawn scale.
 * @returns One span per band, worst first.
 */
export function buildBandSpans(min = 0, max = 100): MethodBandSpan[] {
  const span = max - min;
  return SCORE_BANDS.map((band) => {
    const from = Math.max(band.min, min);
    const to = Math.min(band.max, max);
    const range = !Number.isFinite(band.min)
      ? `< ${band.max}`
      : !Number.isFinite(band.max)
        ? `> ${band.min}`
        : `${band.min}-${band.max}`;
    return {
      key: band.key,
      name: band.label.replace(/\s*\(.*\)$/, ''),
      range,
      from,
      to,
      width: span > 0 ? ((to - from) / span) * 100 : 0,
      color: band.color,
      meaning: BAND_MEANINGS[band.key],
    };
  });
}
