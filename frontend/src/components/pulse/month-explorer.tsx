'use client';

import { useMemo, useState } from 'react';

import { ContributionBars } from '@/components/charts/contribution-bars';
import { PulsePillarList } from '@/components/pulse/pillar-list';
import { PulseVariableTable } from '@/components/pulse/variable-table';
import { FacetSelect } from '@/components/ui/facet-select';
import { ScoreBadge } from '@/components/ui/score-badge';
import { buildVariableRows } from '@/lib/pulse/company-view';
import { formatConfidence, formatConfidencePoints } from '@/lib/pulse/format';
import {
  buildMonthOptions,
  findMonth,
  sortByContribution,
  sumVariableContributions,
} from '@/lib/pulse/month-view';
import type {
  PulsePillarMeta,
  PulseSeriesPoint,
  PulseVariableMeta,
} from '@/lib/pulse/types';
import { formatMonth, formatNumber } from '@/lib/format';

interface PulseMonthExplorerProps {
  /** Observed months, ascending. */
  series: readonly PulseSeriesPoint[];
  pillars: readonly PulsePillarMeta[];
  variables: readonly PulseVariableMeta[];
}

/**
 * Opens any observed month and shows how its score was built.
 *
 * The selector defaults to the last close, which is the month every other
 * figure of the page refers to; choosing an earlier one re-reads the four
 * pillars, the points each variable contributed and the eleven raw figures of
 * that month, so a fall can be traced to the variable that caused it.
 *
 * @param props - The observed months and the score metadata.
 * @returns The month selector with the pillars, the contributions and the
 * variable table of the selected month.
 */
export function PulseMonthExplorer({
  series,
  pillars,
  variables,
}: PulseMonthExplorerProps) {
  const options = useMemo(() => buildMonthOptions(series), [series]);
  const [month, setMonth] = useState(options[0]?.id ?? '');
  const point = findMonth(series, month);

  const pillarLabels = useMemo(
    () => Object.fromEntries(pillars.map((item) => [item.key, item.label])),
    [pillars],
  );
  const rows = useMemo(
    () => buildVariableRows(variables, point, pillarLabels),
    [variables, point, pillarLabels],
  );
  const byContribution = useMemo(() => sortByContribution(rows), [rows]);
  const unknown = rows.filter((row) => !row.known).length;

  if (!point) {
    return (
      <p className="text-sm text-muted">
        Sin meses observados: las variables aparecerán con el primer cierre.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <FacetSelect
          label="Mes observado"
          options={options}
          selected={point.month}
          onSelect={setMonth}
          className="w-36"
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">
            <ScoreBadge score={point.pulse} />
          </span>
          <span className="text-sm text-muted">
            PULSE de {formatMonth(point.month)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">
            {formatConfidence(point.confidence)}
          </span>
          <span className="text-sm text-muted">
            {formatConfidencePoints(point.confidence)}
            {unknown > 0 &&
              ` · ${formatNumber(unknown)} de ${formatNumber(rows.length)} variables sin datos`}
          </span>
        </div>
      </div>

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Pilares del mes</h3>
          <PulsePillarList pillars={pillars} scores={point.pillars} />
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            Puntos que aporta cada variable
          </h3>
          <ContributionBars
            rows={byContribution}
            emptyText="Ninguna variable tiene datos este mes."
          />
          <p className="text-sm text-muted">
            Los aportes suman {formatNumber(sumVariableContributions(rows), 2)},
            que es el PULSE de {formatMonth(point.month)}.
          </p>
        </div>
      </div>

      <PulseVariableTable rows={rows} />
    </div>
  );
}
