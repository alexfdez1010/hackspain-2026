import { ScoreBadge } from '@/components/ui/score-badge';
import { StatGrid, type StatItem } from '@/components/ui/stat-grid';
import { directionText } from '@/lib/method/variables';
import { formatRawValue, UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseVariableView } from '@/lib/pulse/variable-view';
import {
  formatMonth,
  formatNumber,
  formatPercent,
  formatSigned,
} from '@/lib/format';
import { scoreBand } from '@/lib/score';

interface PulseVariableHeaderProps {
  view: PulseVariableView;
}

/**
 * Builds the four figures that read the last observed month of the variable.
 *
 * @param view - The variable of one company.
 * @returns Value, points contributed, monthly move and data coverage.
 */
function lastMonthStats(view: PulseVariableView): StatItem[] {
  const { doc, last, pillar, shareOfPillar, stats, variable } = view;
  const previousScore =
    last && last.score !== null && last.change !== null
      ? last.score - last.change
      : null;
  const firstMonth = view.points[0]?.month ?? '';
  return [
    {
      key: 'value',
      label: 'Valor',
      value: formatRawValue(last?.raw ?? null, variable.unit),
      hint: doc ? `Dirección: ${directionText(doc.better)}` : undefined,
    },
    {
      key: 'contribution',
      label: 'Aporte al PULSE',
      value: `${formatNumber(last?.contribution ?? null, 2)} de ${formatNumber(variable.weight)} pts`,
      hint: `${formatPercent(shareOfPillar, 0)} de los puntos del pilar ${pillar.label}`,
    },
    {
      key: 'change',
      label: 'Variación vs mes anterior',
      value: formatSigned(last?.change ?? null),
      hint:
        previousScore === null
          ? 'Sin mes anterior con datos'
          : `Desde ${formatNumber(previousScore, 1)} puntos`,
    },
    {
      key: 'coverage',
      label: 'Meses con datos',
      value: `${formatNumber(stats.known)} de ${formatNumber(stats.total)}`,
      hint: firstMonth ? `Desde ${formatMonth(firstMonth)}` : undefined,
    },
  ];
}

/**
 * Builds the four figures computed over the whole observed history.
 *
 * @param view - The variable of one company.
 * @returns Mean, best month, worst month and trend.
 */
function historyStats(view: PulseVariableView): StatItem[] {
  const { best, mean, trend, worst } = view.stats;
  return [
    {
      key: 'mean',
      label: 'Media',
      value: formatNumber(mean, 1),
      hint: 'Sobre los meses con datos',
    },
    {
      key: 'best',
      label: 'Mejor mes',
      value: formatNumber(best?.score ?? null, 1),
      hint: best ? formatMonth(best.month) : undefined,
    },
    {
      key: 'worst',
      label: 'Peor mes',
      value: formatNumber(worst?.score ?? null, 1),
      hint: worst ? formatMonth(worst.month) : undefined,
    },
    {
      key: 'trend',
      label: 'Tendencia',
      value: formatSigned(trend),
      hint: 'Del primer al último mes con datos',
    },
  ];
}

/**
 * Opens the page of one variable with the score of the last close, the raw
 * figure behind it and the points it puts into the PULSE of that month.
 *
 * A month without evidence never becomes a zero: the headline reads
 * «sin datos» and every derived figure falls back to an em dash, so the
 * reader can tell an unmeasured variable from a bad one.
 *
 * @param props - The variable of one company.
 * @returns The headline score and the two rows of qualifiers.
 */
export function PulseVariableHeader({ view }: PulseVariableHeaderProps) {
  const { last, variable } = view;
  const score = last?.score ?? null;
  const band = scoreBand(score);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
        <div className="flex flex-col gap-1">
          {score === null ? (
            <span className="text-5xl font-semibold tracking-tight text-muted">
              {UNKNOWN_TEXT}
            </span>
          ) : (
            <ScoreBadge score={score} size="lg" />
          )}
          <p className="text-sm text-muted">
            {last
              ? `Score de ${variable.label} en ${formatMonth(last.month)}${
                  score === null ? '' : ` · ${band.label}`
                }`
              : `Sin meses observados para ${variable.label}`}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <StatGrid items={lastMonthStats(view)} columns={4} />
        </div>
      </div>
      <StatGrid items={historyStats(view)} columns={4} />
    </div>
  );
}
