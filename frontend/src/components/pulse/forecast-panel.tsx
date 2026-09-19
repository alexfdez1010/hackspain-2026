'use client';

import { useMemo, useState } from 'react';

import { ChipRow } from '@/components/pulse/chip-row';
import { ForecastDrivers } from '@/components/pulse/forecast-drivers';
import { PlainFact } from '@/components/pulse/plain-fact';
import { ScoreHeadline } from '@/components/pulse/score-headline';
import { Panel } from '@/components/ui/panel';
import {
  buildContributionItems,
  sumContributions,
} from '@/lib/pulse/company-view';
import { formatBand, formatHorizon } from '@/lib/pulse/format';
import type { PulseForecastPoint, PulseVariableMeta } from '@/lib/pulse/types';
import { formatMonth, formatNumber, formatSigned } from '@/lib/format';

interface PulseForecastPanelProps {
  /** Forecast horizons, ascending. */
  forecast: readonly PulseForecastPoint[];
  /** Variable metadata, used to label the bars. */
  variables: readonly PulseVariableMeta[];
  /** Score of the last observed month, the base of the predicted change. */
  pulseNow: number | null;
}

/**
 * Decomposes the forecast of one horizon into the drivers that build it.
 *
 * The horizon is a chip because the mix changes with distance: the nearest
 * months are carried by the company's own variables, the farthest by the model
 * base. The bars always sum to the predicted change, and the footnote prints
 * that sum so the decomposition can be checked rather than believed.
 *
 * @param props - Forecast horizons, variable labels and today's score.
 * @returns The horizon chips, the predicted score with its band and the
 * diverging bars of the decomposition.
 */
export function PulseForecastPanel({
  forecast,
  variables,
  pulseNow,
}: PulseForecastPanelProps) {
  const last = forecast[forecast.length - 1];
  const [horizon, setHorizon] = useState(String(last?.horizon ?? ''));
  const point =
    forecast.find((item) => String(item.horizon) === horizon) ?? last;
  const items = useMemo(
    () => (point ? buildContributionItems(point, variables) : []),
    [point, variables],
  );

  if (!point) {
    return (
      <Panel>
        <p className="text-sm text-ink-secondary">
          Sin previsión publicada para esta empresa.
        </p>
      </Panel>
    );
  }

  const change =
    point.pulsePred !== null && pulseNow !== null
      ? point.pulsePred - pulseNow
      : null;

  return (
    <Panel>
      <div className="mb-6">
        <ChipRow
          label="Horizonte de previsión"
          options={forecast.map((item) => ({
            id: String(item.horizon),
            label: formatHorizon(item.horizon),
          }))}
          selected={String(point.horizon)}
          onSelect={setHorizon}
        />
      </div>
      <div className="flex flex-wrap items-end justify-between gap-8 border-b border-hairline pb-6">
        <ScoreHeadline
          score={point.pulsePred}
          caption={`PULSE previsto en ${formatMonth(point.targetMonth)}`}
        />
        <div className="flex flex-wrap gap-10">
          <PlainFact
            value={formatSigned(change)}
            label={`Frente a los ${formatNumber(pulseNow, 1)} de hoy`}
          />
          <PlainFact
            value={formatBand(point.pulseP10, point.pulseP90)}
            label="Banda p10-p90"
          />
        </div>
      </div>
      <h3 className="mb-4 mt-6 text-sm font-medium text-ink-secondary">
        De dónde sale el cambio previsto
      </h3>
      <ForecastDrivers items={items} />
      <p className="mt-4 text-[13px] text-ink-secondary">
        Las {formatNumber(items.length)} barras suman{' '}
        {formatSigned(sumContributions(point), 2)} puntos, el cambio previsto a{' '}
        {formatHorizon(point.horizon)}.
      </p>
    </Panel>
  );
}
