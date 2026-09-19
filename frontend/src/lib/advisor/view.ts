import type {
  AdvisorLever,
  AdvisorPriceComponent,
  AdvisorReason,
} from '@/lib/advisor/types';
import { formatNumber, formatPercent } from '@/lib/format';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';

/** One component of the price, laid out as a segment of the stacked bar. */
export interface PriceSegment {
  key: string;
  label: string;
  /** Basis points of the component; negative when it lowers the rate. */
  bps: number;
  detail: string;
  /** Width of the segment as a share of the bar, in percent. */
  share: number;
  /** Left edge of the segment, in percent. */
  offset: number;
  /** `true` when the component subtracts from the rate. */
  subtractive: boolean;
  /** Fill opacity, stepped down so consecutive segments stay apart. */
  opacity: number;
}

/** Width the bar keeps for a component of zero basis points, in percent. */
const MIN_SHARE = 0.6;

/**
 * Lays the price components out as a stacked bar.
 *
 * Widths are shares of the sum of the absolute basis points, so a discount
 * takes the room its size deserves instead of shortening the bar: the sign is
 * carried by {@link PriceSegment.subtractive} and by the printed figure.
 *
 * @param components - Components of the price, reference rate first.
 * @returns One segment per component, in the order they are priced.
 */
export function buildPriceSegments(
  components: readonly AdvisorPriceComponent[],
): PriceSegment[] {
  const total = components.reduce((sum, item) => sum + Math.abs(item.bps), 0);
  const even = components.length > 0 ? 100 / components.length : 0;
  let offset = 0;
  return components.map((item, index) => {
    const share =
      total > 0
        ? Math.max((Math.abs(item.bps) / total) * 100, MIN_SHARE)
        : even;
    const segment: PriceSegment = {
      key: item.key,
      label: item.label,
      bps: item.bps,
      detail: item.detail,
      share,
      offset,
      subtractive: item.bps < 0,
      opacity: Math.max(0.95 - index * 0.18, 0.3),
    };
    offset += share;
    return segment;
  });
}

/**
 * Orders the levers by the premium they would save.
 *
 * @param levers - Levers as published, in pillar order.
 * @returns A new array, largest saving first; levers without a saving last.
 */
export function sortLevers(levers: readonly AdvisorLever[]): AdvisorLever[] {
  return [...levers].sort(
    (a, b) => (b.premiumSavingBps ?? -1) - (a.premiumSavingBps ?? -1),
  );
}

/**
 * Reads the pillar whose lever saves the most, to highlight it once.
 *
 * @param levers - Levers of an offer or of the improvement plan.
 * @returns The pillar key, or `null` when no lever saves anything.
 */
export function topLeverPillar(levers: readonly AdvisorLever[]): string | null {
  const best = sortLevers(levers)[0];
  if (!best || (best.premiumSavingBps ?? 0) <= 0) return null;
  return best.pillar;
}

/**
 * Clamps a fit to the 0-100 range the bar can draw.
 *
 * @param fit - Fit of the offer; `null` when the backend did not score it.
 * @returns A percentage between 0 and 100.
 */
export function fitPercent(fit: number | null): number {
  if (fit === null || !Number.isFinite(fit)) return 0;
  return Math.min(Math.max(fit, 0), 100);
}

/**
 * Orders the reasons the way they are argued: blockers, then pros, then cons.
 *
 * Within a kind the heaviest reason comes first, so the figure that decided
 * the fit is the first one read.
 *
 * @param reasons - Reasons of an offer.
 * @returns A new ordered array.
 */
export function sortReasons(
  reasons: readonly AdvisorReason[],
): AdvisorReason[] {
  const rank = { bloqueo: 0, pro: 1, contra: 2 };
  return [...reasons].sort(
    (a, b) =>
      rank[a.kind] - rank[b.kind] || Math.abs(b.points) - Math.abs(a.points),
  );
}

/**
 * Renders the figure a driver of the stress model read, in its own unit.
 *
 * @param feature - Feature key, such as `pillar_liquidez` or `confidence`.
 * @param value - Value the model read; `null` when the month has none.
 * @returns The formatted figure, or `sin datos`.
 */
export function formatRiskDriverValue(
  feature: string,
  value: number | null,
): string {
  if (value === null || !Number.isFinite(value)) return UNKNOWN_TEXT;
  if (feature === 'confidence') return formatPercent(value, 0);
  if (feature.startsWith('pillar_')) return `${formatNumber(value, 1)}/100`;
  return formatNumber(value, 2);
}
