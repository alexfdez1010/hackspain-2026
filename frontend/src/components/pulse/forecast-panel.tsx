'use client';

import { useMemo, useState } from 'react';

import { ImpactBars } from '@/components/charts/impact-bars';
import { FacetSelect, type FacetOption } from '@/components/radar/facet-select';
import { ScoreBadge } from '@/components/xray/score-badge';
import {
  buildContributionItems,
  sumContributions,
} from '@/lib/pulse/company-view';
import { formatBand, formatHorizon } from '@/lib/pulse/format';
import type { PulseForecastPoint, PulseVariableMeta } from '@/lib/pulse/types';
import { formatMonth, formatNumber, formatSigned } from '@/lib/xray/format';

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
 * The horizon is selectable because the mix changes with distance: the nearest
 * months are carried by the variables, the farthest by the model base.
 *
 * @param props - Forecast horizons, variable labels and today's score.
 * @returns The horizon selector, the predicted score with its band and the
 * diverging bars of the decomposition.
 */
export function PulseForecastPanel({
  forecast,
  variables,
  pulseNow,
}: PulseForecastPanelProps) {
  const options: FacetOption[] = forecast.map((point) => ({
    id: String(point.horizon),
    label: formatHorizon(point.horizon),
  }));
  const [horizon, setHorizon] = useState(
    String(forecast[forecast.length - 1]?.horizon ?? 6),
  );
  const point =
    forecast.find((item) => String(item.horizon) === horizon) ??
    forecast[forecast.length - 1];

  const items = useMemo(
    () => (point ? buildContributionItems(point, variables) : []),
    [point, variables],
  );

  if (!point) {
    return (
      <p className="text-sm text-muted">
        Sin previsión publicada para esta empresa.
      </p>
    );
  }

  const change =
    point.pulsePred !== null && pulseNow !== null
      ? point.pulsePred - pulseNow
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
        <FacetSelect
          label="Horizonte de previsión"
          options={options}
          selected={horizon}
          onSelect={setHorizon}
          className="w-28"
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">
            <ScoreBadge score={point.pulsePred} />
          </span>
          <span className="text-sm text-muted">
            PULSE previsto en {formatMonth(point.targetMonth)} · banda p10-p90{' '}
            {formatBand(point.pulseP10, point.pulseP90)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">
            {formatSigned(change)}
          </span>
          <span className="text-sm text-muted">
            Frente a los {formatNumber(pulseNow, 1)} puntos de hoy
          </span>
        </div>
      </div>

      <ImpactBars
        items={items}
        digits={2}
        emptyText="El modelo no publicó descomposición para este horizonte."
      />

      <p className="max-w-3xl text-sm text-muted">
        Cada barra son puntos de <code>pulse_raw</code>; las{' '}
        {formatNumber(items.length)} suman{' '}
        {formatSigned(sumContributions(point), 2)}, que es exactamente el cambio
        previsto <code>delta_raw</code> de {formatSigned(point.deltaRaw, 2)}.
      </p>
    </div>
  );
}
