/** One segment of the aging bar: what it is called and how severe it is. */
export interface AgingBucketView {
  /** Bucket key of the export. */
  key: string;
  /** Label of the segment. */
  label: string;
  /** Colour of the segment; severity grows with the days past due. */
  color: string;
  /** Fill opacity, so two segments of the same band stay distinguishable. */
  opacity: number;
}

/** The five aging buckets, in the order the export publishes them. */
export const AGING_BUCKETS: readonly AgingBucketView[] = [
  {
    key: 'al_dia',
    label: 'Al día',
    color: 'var(--surface-tertiary)',
    opacity: 1,
  },
  { key: '1_30', label: '1-30', color: 'var(--score-neutral)', opacity: 0.4 },
  { key: '31_60', label: '31-60', color: 'var(--score-neutral)', opacity: 0.85 },
  { key: '61_90', label: '61-90', color: 'var(--score-fragile)', opacity: 1 },
  {
    key: 'mas_90',
    label: '+90 días',
    color: 'var(--score-critical)',
    opacity: 1,
  },
];

/**
 * Describes one aging bucket.
 *
 * @param bucket - Bucket key of the export.
 * @returns The known segment, or a neutral one keeping the raw key as label.
 */
export function agingBucketView(bucket: string): AgingBucketView {
  return (
    AGING_BUCKETS.find((entry) => entry.key === bucket) ?? {
      key: bucket,
      label: bucket,
      color: 'var(--surface-tertiary)',
      opacity: 1,
    }
  );
}

/**
 * Labels one aging bucket.
 *
 * @param bucket - Bucket key of the export.
 * @returns The Spanish label, or the key itself when it is unknown.
 */
export function agingBucketLabel(bucket: string): string {
  return agingBucketView(bucket).label;
}

/** How tight a credit line is, on the colour scale of the score. */
export interface UtilisationBand {
  /** Label read out next to the figure, so colour is never alone. */
  label: string;
  /** Colour of the fill. */
  color: string;
}

/**
 * Bands the utilisation of a credit line: comfortable below half the limit,
 * critical once it is drawn past the limit.
 *
 * @param util - Drawn over limit; `null` when the line has no limit.
 * @returns The label and the colour of the band.
 */
export function utilisationBand(util: number | null): UtilisationBand {
  if (util === null || !Number.isFinite(util)) {
    return { label: 'sin límite conocido', color: 'var(--separator)' };
  }
  if (util > 1) {
    return { label: 'por encima del límite', color: 'var(--score-critical)' };
  }
  if (util >= 0.8) {
    return { label: 'cerca del límite', color: 'var(--score-fragile)' };
  }
  if (util >= 0.5) return { label: 'uso medio', color: 'var(--score-neutral)' };
  return { label: 'holgada', color: 'var(--score-solid)' };
}
