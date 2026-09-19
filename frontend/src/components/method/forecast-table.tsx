'use client';

import { Table } from '@heroui/react';

import { formatHorizon } from '@/lib/pulse/format';
import type { PulseForecastHorizonEvaluation } from '@/lib/pulse/types';
import { formatNumber, formatPercent } from '@/lib/format';

interface MethodForecastTableProps {
  /** One row per horizon, ascending. */
  horizons: readonly PulseForecastHorizonEvaluation[];
  /** Rendered when the export carries no forecast evaluation. */
  emptyText: string;
}

/**
 * Publishes the out-of-fold accuracy of the forecast at every horizon, next to
 * the two baselines it has to beat.
 *
 * Persistence («el score se queda donde está») is the honest reference: a model
 * that does not beat it adds nothing.
 *
 * @param props - The evaluated horizons and the empty text.
 * @returns The table of metrics.
 */
export function MethodForecastTable({
  horizons,
  emptyText,
}: MethodForecastTableProps) {
  if (horizons.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  const rows = horizons.map((row) => ({ ...row, id: String(row.horizon) }));
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Precisión de la previsión por horizonte">
          <Table.Header>
            <Table.Column id="horizon" isRowHeader>
              Horizonte
            </Table.Column>
            <Table.Column id="persist">MAE persistencia</Table.Column>
            <Table.Column id="reversion">MAE reversión</Table.Column>
            <Table.Column id="ml">MAE modelo</Table.Column>
            <Table.Column id="gain">Ganancia</Table.Column>
            <Table.Column id="direction">Dirección</Table.Column>
            <Table.Column id="declines">Caídas vistas</Table.Column>
            <Table.Column id="improvements">Mejoras vistas</Table.Column>
            <Table.Column id="coverage">Cobertura p10-p90</Table.Column>
          </Table.Header>
          <Table.Body items={rows}>
            {(row) => (
              <Table.Row id={row.id}>
                <Table.Cell className="tabular-nums">
                  {formatHorizon(row.horizon)}
                </Table.Cell>
                <Table.Cell className="tabular-nums text-muted">
                  {formatNumber(row.maePersist, 2)}
                </Table.Cell>
                <Table.Cell className="tabular-nums text-muted">
                  {formatNumber(row.maeReversion, 2)}
                </Table.Cell>
                <Table.Cell className="font-medium tabular-nums">
                  {formatNumber(row.maeMl, 2)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatNumber(row.gainVsPersistPct, 1)} %
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatPercent(row.directionAccuracyBigMoves, 0)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatPercent(row.recallDeclines, 0)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatPercent(row.recallImprovements, 0)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatPercent(row.bandCoverage, 0)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
