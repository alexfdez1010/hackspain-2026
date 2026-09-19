import { EventScoreCurve } from '@/components/monitor/event-score-curve';
import { StatGrid } from '@/components/xray/stat-grid';
import { formatNumber, formatPercent } from '@/lib/xray/format';
import type { Anticipation } from '@/lib/xray/anticipation';

interface AnticipationPanelProps {
  anticipation: Anticipation;
}

/**
 * Turns a horizon key such as `h3` into the Spanish label of the horizon.
 *
 * @param horizon - Key published by the service.
 * @returns A label such as `3 meses`.
 */
function horizonLabel(horizon: string): string {
  const months = horizon.replace(/\D/g, '');
  if (months === '') return horizon;
  return months === '1' ? '1 mes' : `${months} meses`;
}

/** Spanish headings for the definition keys published by the service. */
const DEFINITION_LABELS: Record<string, string> = {
  evento: 'Evento',
  lead_time: 'Adelanto',
  deteccion_h: 'Detección a h meses',
  falsa_alarma: 'Falsa alarma',
  auroc_h: 'AUROC a h meses',
};

/**
 * Shows how early the monitor fires before a stress episode, what that costs in
 * false alarms, and how well the score orders the risk out of sample.
 *
 * @param props - The anticipation block published by the ML service.
 * @returns The lead-time figures, the detection curve and the AUROC table.
 */
export function AnticipationPanel({ anticipation }: AnticipationPanelProps) {
  const { leadTime, falseAlarms, aurocOof, scoreCurve } = anticipation;

  if (!leadTime && aurocOof.length === 0 && scoreCurve.length === 0) {
    return (
      <p className="max-w-3xl text-sm text-muted">
        El servicio todavía no ha publicado el bloque de anticipación.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {leadTime && (
        <StatGrid
          columns={4}
          items={[
            {
              key: 'median',
              label: 'Adelanto mediano',
              value: `${formatNumber(leadTime.medianLeadMonths)} meses`,
              hint: `Rango intercuartílico ${formatNumber(leadTime.p25LeadMonths)}–${formatNumber(leadTime.p75LeadMonths)}`,
            },
            {
              key: 'covered',
              label: 'Eventos avisados',
              value: formatPercent(leadTime.shareEventsAlerted, 1),
              hint: `${formatNumber(leadTime.nEventsAlerted)} de ${formatNumber(leadTime.nEvents)} episodios`,
            },
            {
              key: 'false',
              label: 'Falsas alarmas',
              value: formatPercent(falseAlarms?.falseAlarmShare ?? null, 1),
              hint: `${formatNumber(falseAlarms?.perCompanyMonth ?? null, 2)} por empresa y mes`,
            },
            {
              key: 'window',
              label: 'Ventana de aviso',
              value: `${formatNumber(anticipation.lookbackMonths)} meses`,
              hint: 'Se busca la primera alerta en esta ventana',
            },
          ]}
        />
      )}

      {leadTime && Object.keys(leadTime.detectionRate).length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted">
            Eventos avisados con al menos este adelanto
          </h3>
          <dl className="grid grid-cols-3 gap-x-6 gap-y-3 sm:grid-cols-6">
            {Object.entries(leadTime.detectionRate).map(([horizon, rate]) => (
              <div key={horizon} className="flex flex-col">
                <dt className="order-2 text-sm text-muted">
                  {horizonLabel(horizon)}
                </dt>
                <dd className="order-1 text-lg font-semibold tabular-nums">
                  {formatPercent(rate, 0)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {scoreCurve.length > 1 && (
        <EventScoreCurve
          curve={scoreCurve}
          populationMean={anticipation.populationMeanScore}
        />
      )}

      {aurocOof.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted">
            AUROC fuera de muestra, por horizonte
          </h3>
          <dl className="grid grid-cols-3 gap-x-6 gap-y-3">
            {aurocOof.map((point) => (
              <div key={point.horizon} className="flex flex-col">
                <dt className="order-2 text-sm text-muted">
                  {horizonLabel(point.horizon)}
                </dt>
                <dd className="order-1 text-lg font-semibold tabular-nums">
                  {formatNumber(point.auroc, 3)}
                </dd>
                <p className="order-3 text-xs text-muted">
                  {formatNumber(point.positives)} positivos de{' '}
                  {formatNumber(point.n)}
                </p>
              </div>
            ))}
          </dl>
        </div>
      )}

      {Object.keys(anticipation.definitions).length > 0 && (
        <dl className="flex max-w-3xl flex-col gap-2 text-sm">
          {Object.entries(anticipation.definitions).map(([term, text]) => (
            <div key={term} className="flex flex-wrap gap-x-2">
              <dt className="font-medium">
                {DEFINITION_LABELS[term] ?? term.replace(/_/g, ' ')}:
              </dt>
              <dd className="text-muted">{text}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
