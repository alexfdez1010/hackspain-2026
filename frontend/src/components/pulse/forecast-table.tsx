'use client';

import { Table } from '@heroui/react';

import { ScoreBadge } from '@/components/ui/score-badge';
import { formatBand, formatHorizon } from '@/lib/pulse/format';
import type { PulseForecastRow } from '@/lib/pulse/history';
import { formatMonth, formatSigned } from '@/lib/format';

interface PulseForecastTableProps {
  /** Forecast horizons, nearest month first. */
  rows: readonly PulseForecastRow[];
  /** Month of the last close, named so the horizons can be anchored. */
  baseMonth: string;
}

/**
 * Lists the six predicted months with their band and the move they imply.
 *
 * Nothing in these rows is a measurement: the month column says «previsto» on
 * every line, the band is printed next to the point prediction, and the change
 * is always taken against the last observed score, which the caption names.
 *
 * @param props - The forecast rows and the month they are predicted from.
 * @returns The forecast table, or an empty state.
 */
export function PulseForecastTable({
  rows,
  baseMonth,
}: PulseForecastTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        Sin previsión publicada: hacen falta más meses observados para
        estimarla.
      </p>
    );
  }

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="PULSE previsto por horizonte">
          <Table.Header>
            <Table.Column id="month" isRowHeader>
              Mes previsto
            </Table.Column>
            <Table.Column id="horizon">Horizonte</Table.Column>
            <Table.Column id="pulse">PULSE previsto</Table.Column>
            <Table.Column id="band">Banda p10-p90</Table.Column>
            <Table.Column id="change">
              Δ vs {formatMonth(baseMonth)}
            </Table.Column>
            <Table.Column id="delta">Δ previsto</Table.Column>
          </Table.Header>
          <Table.Body items={rows}>
            {(row) => (
              <Table.Row id={String(row.horizon)}>
                <Table.Cell className="whitespace-nowrap">
                  {formatMonth(row.targetMonth)}
                  <span className="block text-xs text-muted">previsto</span>
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatHorizon(row.horizon)}
                </Table.Cell>
                <Table.Cell>
                  <ScoreBadge score={row.pulsePred} />
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatBand(row.pulseP10, row.pulseP90)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatSigned(row.change)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatSigned(row.delta, 2)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
