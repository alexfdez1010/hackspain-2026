import type { MethodExample } from '@/lib/method/example';

/** The arithmetic of one variable of the worked month, step by step. */
export interface MethodWorkedRow {
  label: string;
  month: string;
  /** Points of the 100 the variable owns. */
  weight: number;
  /** Points of the 100 that had data that month, the base of the average. */
  knownWeight: number;
  /** Share of the score the variable carried that month, 0 to 1. */
  share: number;
  /** 0-100 score of the variable that month. */
  score: number;
  /** Points of PULSE the variable added, as the export publishes them. */
  contribution: number;
  /** Variables left to add after this one. */
  others: number;
  pulse: number | null;
}

/**
 * Picks the variable that added most to the worked month and lays out its
 * arithmetic, so a reader can repeat it with a calculator.
 *
 * The share is the weight of the variable over the weight that had data,
 * which is why the contributions of a month add up to its PULSE.
 *
 * @param example - Worked month of the page; `null` when the export has none.
 * @returns The steps, or `null` when there is no variable to work.
 */
export function buildWorkedRow(
  example: MethodExample | null,
): MethodWorkedRow | null {
  const row = example?.rows[0];
  if (!example || !row || row.score === null) return null;
  const knownWeight = example.rows.reduce((sum, item) => sum + item.weight, 0);
  if (knownWeight <= 0) return null;
  return {
    label: row.label,
    month: example.month,
    weight: row.weight,
    knownWeight,
    share: row.weight / knownWeight,
    score: row.score,
    contribution: row.contribution,
    others: example.rows.length - 1,
    pulse: example.pulse,
  };
}
