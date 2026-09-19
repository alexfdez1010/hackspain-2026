'use client';

import { useMemo, useState } from 'react';

import { ChipRow } from '@/components/pulse/chip-row';
import { FactGrid } from '@/components/pulse/fact-grid';
import { MonthContributions } from '@/components/pulse/month-contributions';
import { PulsePillarList } from '@/components/pulse/pillar-list';
import { ScoreHeadline } from '@/components/pulse/score-headline';
import { Panel } from '@/components/ui/panel';
import { buildVariableRows } from '@/lib/pulse/company-view';
import { formatConfidence, formatWeightPoints } from '@/lib/pulse/format';
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
 * The chips default to the last close, which is the month every other figure
 * of the page refers to; choosing an earlier one re-reads the four pillars and
 * the points each variable contributed that month, so a fall can be traced to
 * the variable that caused it. The contributions add up to the PULSE of the
 * month, and the footnote says so with the figure.
 *
 * @param props - The observed months and the score metadata.
 * @returns The month chips with the pillars and the contributions of the
 * selected month.
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

  if (!point) {
    return (
      <Panel>
        <p className="text-sm text-ink-secondary">
          Sin meses observados: las variables aparecerán con el primer cierre.
        </p>
      </Panel>
    );
  }

  const unknown = rows.filter((row) => !row.known).length;
  const label = formatMonth(point.month);

  return (
    <Panel>
      <div className="mb-6">
        <ChipRow
          label="Mes observado"
          options={options}
          selected={point.month}
          onSelect={setMonth}
        />
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
        <div>
          <ScoreHeadline score={point.pulse} caption={`PULSE de ${label}`} />
          <div className="mt-6">
            <FactGrid
              columns={2}
              items={[
                {
                  key: 'confidence',
                  value: formatConfidence(point.confidence),
                  label: `Confianza: ${formatWeightPoints(point.confidence)}`,
                },
                {
                  key: 'unknown',
                  value: `${formatNumber(unknown)} de ${formatNumber(rows.length)}`,
                  label: `Variables sin dato en ${label}`,
                },
              ]}
            />
          </div>
          <h3 className="mb-4 mt-8 text-sm font-medium text-ink-secondary">
            Pilares del mes
          </h3>
          <PulsePillarList pillars={pillars} scores={point.pillars} />
        </div>
        <div>
          <h3 className="mb-4 text-sm font-medium text-ink-secondary">
            Aporte de cada variable, en puntos de PULSE
          </h3>
          <MonthContributions rows={byContribution} />
          <p className="mt-4 text-[13px] text-ink-secondary">
            Suman {formatNumber(sumVariableContributions(rows), 2)}, el PULSE de{' '}
            {label}.
          </p>
        </div>
      </div>
    </Panel>
  );
}
