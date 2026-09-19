import type { ChartKind, RankingKind } from '@/lib/assistant/charts/types';

/**
 * What the model is told after a chart was drawn; the data stays in the UI.
 * A type literal, not an interface, so it satisfies the SDK's JSON value.
 */
export type ChartModelOutput = {
  shown: boolean;
  kind: ChartKind | 'error';
  title: string | null;
  summary: string;
};

/** Everything the model may ask `show_chart` for. */
export interface ChartRequest {
  kind: ChartKind;
  /** Variable key, for `variable` and `caja` (`cash_days` or `cash_min`). */
  variable?: string;
  /** Two to four variable keys, for `comparar`. */
  variables?: string[];
  /** Forecast horizon in months, for `impulsores`. */
  horizon?: number;
  /** Observed month, for `variables` and `puntos`; the last one by default. */
  month?: string;
  ranking?: RankingKind;
}
