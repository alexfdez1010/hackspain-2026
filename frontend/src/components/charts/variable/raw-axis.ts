import { niceDomain } from '@/components/charts/geometry';
import { formatNumber, formatPercent } from '@/lib/format';

/** Vertical domain of the raw figure, always with the zero inside. */
export interface RawDomain {
  min: number;
  max: number;
  /** `true` when the variable takes negative figures and needs a zero axis. */
  signed: boolean;
}

/**
 * Chooses the domain of the raw figure of a variable.
 *
 * Bars are read against zero, so zero is always part of the domain: a series
 * that never goes below it starts at zero, and a series that does keeps the
 * negative side and draws the axis line.
 *
 * @param values - Raw figures of the months with evidence.
 * @returns The domain and whether it crosses zero.
 */
export function rawDomain(values: readonly number[]): RawDomain {
  const signed = values.some((value) => value < 0);
  const domain = niceDomain([...values, 0], signed ? {} : { min: 0 });
  return { min: signed ? domain.min : 0, max: domain.max, signed };
}

/**
 * Picks the two or three values printed on the vertical axis.
 *
 * @param domain - Domain of the raw figure.
 * @returns The tick values, ascending.
 */
export function rawTicks(domain: RawDomain): number[] {
  const middle = domain.signed ? 0 : (domain.min + domain.max) / 2;
  return [domain.min, middle, domain.max].filter(
    (value, index, all) => all.indexOf(value) === index,
  );
}

/**
 * Renders an axis tick in the unit of the variable, as short as it can be.
 *
 * Shares of the dataset arrive between 0 and 1, so they are printed as whole
 * percentages; every other magnitude keeps one decimal below ten, where the
 * decimal is what separates two ticks.
 *
 * @param value - Tick value.
 * @param unit - Unit string coming from the score metadata.
 * @returns The label of the tick.
 */
export function formatTick(value: number, unit: string): string {
  if (unit.startsWith('%')) return formatPercent(value, 0);
  return formatNumber(value, Math.abs(value) >= 10 ? 0 : 1);
}
