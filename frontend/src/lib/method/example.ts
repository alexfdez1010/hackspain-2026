import { buildVariableRows } from '@/lib/pulse/company-view';
import type {
  PulseCompany,
  PulsePillarMeta,
  PulseSeriesPoint,
  PulseVariableMeta,
} from '@/lib/pulse/types';

/** One variable of the worked example with the points it added. */
export interface MethodExampleRow {
  key: string;
  number: number;
  label: string;
  pillarLabel: string;
  /** Points of the 100 owned by the variable. */
  weight: number;
  /** 0-100 score of the variable that month. */
  score: number | null;
  /** Raw figure behind the score, in `unit`. */
  rawValue: number | null;
  /** Unit of the raw figure, as the export declares it. */
  unit: string;
  /** Points of PULSE the variable added that month. */
  contribution: number;
}

/** The last closed month of one company, read variable by variable. */
export interface MethodExample {
  companyId: string;
  month: string;
  /** Variables with evidence, largest contribution first. */
  rows: MethodExampleRow[];
  /** Sum of the contributions, which must equal `pulse`. */
  contributionSum: number;
  pulse: number | null;
  confidence: number | null;
  /** Labels of the variables without evidence that month. */
  unknownLabels: string[];
  /** Points those variables are worth, and that the score never uses. */
  unknownWeight: number;
}

/**
 * Reads the last closed month of a company as the worked example of the page.
 *
 * Only the variables with evidence are listed, because they are the ones whose
 * contributions add up to PULSE; the rest are named in a sentence so the
 * reader knows the sum is complete and not truncated.
 *
 * @param company - Company to read; `null` when the export has none.
 * @param variables - Variable metadata from the export.
 * @param pillars - Pillar metadata, used for the pillar labels.
 * @returns The example, or `null` when the company has no observed month.
 */
export function buildMethodExample(
  company: PulseCompany | null,
  variables: readonly PulseVariableMeta[],
  pillars: readonly PulsePillarMeta[],
): MethodExample | null {
  const point = company?.series[company.series.length - 1] ?? null;
  if (!company || !point) return null;
  const labels = Object.fromEntries(
    pillars.map((pillar) => [pillar.key, pillar.label]),
  );
  const all = buildVariableRows(variables, point, labels);
  const rows: MethodExampleRow[] = all
    .filter((row) => row.known && row.contribution !== null)
    .map((row) => ({
      key: row.key,
      number: row.number,
      label: row.label,
      pillarLabel: row.pillarLabel,
      weight: row.weight,
      score: row.score,
      rawValue: row.rawValue,
      unit: row.unit,
      contribution: row.contribution ?? 0,
    }))
    .sort((a, b) => b.contribution - a.contribution);
  return {
    companyId: company.companyId,
    month: point.month,
    rows,
    contributionSum: rows.reduce((sum, row) => sum + row.contribution, 0),
    pulse: point.pulse,
    confidence: point.confidence,
    unknownLabels: all.filter((row) => !row.known).map((row) => row.label),
    unknownWeight: all
      .filter((row) => !row.known)
      .reduce((sum, row) => sum + row.weight, 0),
  };
}

/** How much of the weight of a variable rests on data. */
export type MethodCoverage = 'known' | 'proxy' | 'unknown';

/** One variable of the confidence bar with the state of its evidence. */
export interface MethodConfidenceSegment {
  key: string;
  label: string;
  /** Points of the 100 the variable is worth. */
  weight: number;
  coverage: MethodCoverage;
}

/**
 * Splits the 100 points into the variables that had evidence in a month.
 *
 * The export publishes evidence as a boolean, so only `known` and `unknown` are
 * produced here; `proxy` exists in the type because the confidence rule counts
 * a variable covered by a bank proxy as half its weight, and the legend of the
 * figure has to name that third state.
 *
 * @param variables - Variable metadata from the export.
 * @param point - Month to read; `null` leaves every variable unknown.
 * @returns One segment per variable, in specification order.
 */
export function buildConfidenceSegments(
  variables: readonly PulseVariableMeta[],
  point: PulseSeriesPoint | null,
): MethodConfidenceSegment[] {
  return variables.map((variable) => ({
    key: variable.key,
    label: variable.label,
    weight: variable.weight,
    coverage:
      point?.variables[variable.key]?.known === true ? 'known' : 'unknown',
  }));
}
