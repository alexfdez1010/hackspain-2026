'use client';

import { Table } from '@heroui/react';

import { ScoreBadge } from '@/components/ui/score-badge';
import { formatConfidence, UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseMonthRow } from '@/lib/pulse/history';
import type { PulsePillarMeta } from '@/lib/pulse/types';
import {
  formatEuro,
  formatMonth,
  formatNumber,
  formatSigned,
} from '@/lib/format';

interface PulseMonthTableProps {
  /** Observed months, most recent first. */
  rows: readonly PulseMonthRow[];
  /** Pillar metadata; the column order follows the published weights. */
  pillars: readonly PulsePillarMeta[];
}

/**
 * Lists every observed month with the score, its move and the four pillars.
 *
 * Rows run from the last close backwards, because the decision is taken on the
 * newest month and the history is read as context. The change of each row is
 * still measured against the month before it in time, so a positive figure
 * always means the company improved that month.
 *
 * @param props - The month rows and the pillar metadata.
 * @returns The month-by-month table, or an empty state.
 */
export function PulseMonthTable({ rows, pillars }: PulseMonthTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        Sin meses observados: la tabla se llena con el primer cierre exportado.
      </p>
    );
  }
  const columns = [...pillars].sort((a, b) => b.weight - a.weight);

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="PULSE observado mes a mes">
          <Table.Header>
            <Table.Column id="month" isRowHeader>
              Mes observado
            </Table.Column>
            <Table.Column id="pulse">PULSE</Table.Column>
            <Table.Column id="change">Δ mes</Table.Column>
            <Table.Column id="confidence">Confianza</Table.Column>
            {columns.map((pillar) => (
              <Table.Column key={pillar.key} id={pillar.key}>
                {pillar.label}
              </Table.Column>
            ))}
            <Table.Column id="cash">Caja a fin de mes</Table.Column>
          </Table.Header>
          <Table.Body items={rows}>
            {(row) => (
              <Table.Row id={row.month}>
                <Table.Cell className="whitespace-nowrap">
                  {formatMonth(row.month)}
                </Table.Cell>
                <Table.Cell>
                  <ScoreBadge score={row.pulse} />
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {row.change === null ? (
                    <span className="text-muted">primer mes</span>
                  ) : (
                    formatSigned(row.change)
                  )}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatConfidence(row.confidence)}
                  {row.unknownCount > 0 && (
                    <span className="block text-xs text-muted">
                      {formatNumber(row.unknownCount)} var. sin datos
                    </span>
                  )}
                </Table.Cell>
                {columns.map((pillar) => {
                  const value = row.pillars[pillar.key] ?? null;
                  return (
                    <Table.Cell key={pillar.key} className="tabular-nums">
                      {value === null ? (
                        <span className="text-muted">{UNKNOWN_TEXT}</span>
                      ) : (
                        formatNumber(value, 1)
                      )}
                    </Table.Cell>
                  );
                })}
                <Table.Cell className="tabular-nums">
                  {formatEuro(row.cashEnd)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
