'use client';

import { ChartFrame } from '@/components/assistant/charts/chart-frame';
import { CompareLines } from '@/components/assistant/charts/compare-lines';
import { DriverBars } from '@/components/assistant/charts/driver-bars';
import { PillarGrid } from '@/components/assistant/charts/pillar-grid';
import { PointsBars } from '@/components/assistant/charts/points-bars';
import { RankingBars } from '@/components/assistant/charts/ranking-bars';
import { ScoreBars } from '@/components/assistant/charts/score-bars';
import { PulseTrajectoryChart } from '@/components/charts/pulse-trajectory';
import { VariableScoreChart } from '@/components/charts/variable/variable-score-chart';
import { DailyBalanceChart } from '@/components/pulse/variable/detail/daily-balance-chart';
import type { ChartSpec } from '@/lib/assistant/charts/types';
import type { AssistantChartPart } from '@/lib/assistant/types';
import { formatMonth, formatNumber, formatSigned } from '@/lib/format';

/**
 * Draws one chart specification with the product's own SVG components.
 *
 * @param props - The specification.
 * @returns The chart body.
 */
function ChartBody({ spec }: { spec: ChartSpec }) {
  switch (spec.kind) {
    case 'trayectoria':
      return (
        <PulseTrajectoryChart
          points={spec.points}
          boundaryIndex={spec.boundaryIndex}
          signals={spec.signals}
        />
      );
    case 'pilares':
      return <PillarGrid pillars={spec.pillars} />;
    case 'variables':
      return <ScoreBars rows={spec.rows} />;
    case 'puntos':
      return <PointsBars rows={spec.rows} pulse={spec.pulse} />;
    case 'variable':
      return (
        <VariableScoreChart
          points={spec.points}
          label={spec.variable.label}
          pillarLabel={spec.pillarLabel}
        />
      );
    case 'comparar':
      return <CompareLines series={spec.series} />;
    case 'impulsores':
      return (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted">
            {formatMonth(spec.targetMonth)}: PULSE previsto{' '}
            <span className="font-medium text-foreground tabular-nums">
              {formatNumber(spec.pulsePred, 1)}
            </span>
            , {formatSigned(spec.delta, 1)} puntos.
          </p>
          {spec.items.length ? (
            <DriverBars items={spec.items} />
          ) : (
            <p className="text-xs text-muted">
              El modelo no publica impulsores para este horizonte.
            </p>
          )}
        </div>
      );
    case 'caja':
      return (
        <DailyBalanceChart
          daily={spec.daily}
          guide={spec.guide}
          mark={spec.mark}
          ariaLabel={`Saldo diario de caja hasta el cierre de ${formatMonth(spec.month)}`}
        />
      );
    case 'ranking':
      return <RankingBars rows={spec.rows} />;
  }
}

/**
 * The chart part of a reply through its states: a placeholder while the
 * server builds it, a note when it could not be built, and the figure.
 *
 * @param props - The tool part and the navigation callback of its link.
 * @returns The chart, its placeholder or its error.
 */
export function AssistantChart({
  part,
  onNavigate,
}: {
  part: AssistantChartPart;
  onNavigate: () => void;
}) {
  if (part.state === 'output-error' || part.state === 'output-denied')
    return (
      <p role="status" className="text-xs text-muted">
        No he podido dibujar el gráfico.
      </p>
    );
  if (part.state !== 'output-available')
    return (
      <p
        role="status"
        className="flex h-24 items-center justify-center rounded-xl bg-surface-secondary/60 text-xs text-muted"
      >
        Preparando el gráfico…
      </p>
    );
  const spec = part.output;
  if (spec.kind === 'error')
    return (
      <p role="status" className="text-xs text-muted">
        {spec.error}
      </p>
    );
  return (
    <ChartFrame spec={spec} onNavigate={onNavigate}>
      <ChartBody spec={spec} />
    </ChartFrame>
  );
}
