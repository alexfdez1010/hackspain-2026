'use client';

import { Table } from '@heroui/react';

import { ScoreBadge } from '@/components/xray/score-badge';
import type { PulseVariableRow } from '@/lib/pulse/company-view';
import { formatRawValue, UNKNOWN_TEXT } from '@/lib/pulse/format';
import { formatNumber } from '@/lib/xray/format';

interface PulseVariableTableProps {
  /** Variable rows of the month, already ordered by weight. */
  rows: readonly PulseVariableRow[];
}

/**
 * Lists the eleven variables of the month with their weight, score, raw figure
 * and the points they add to the score.
 *
 * A variable with no evidence reads «sin datos» in every column: it contributes
 * nothing, but it is not a zero, and telling both apart is what makes the
 * confidence figure meaningful.
 *
 * @param props - The variable rows of the month being viewed.
 * @returns The variable table.
 */
export function PulseVariableTable({ rows }: PulseVariableTableProps) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Variables del score">
          <Table.Header>
            <Table.Column id="label" isRowHeader>
              Variable
            </Table.Column>
            <Table.Column id="pillar">Pilar</Table.Column>
            <Table.Column id="weight">Peso</Table.Column>
            <Table.Column id="score">Score</Table.Column>
            <Table.Column id="raw">Valor</Table.Column>
            <Table.Column id="contribution">Aporte</Table.Column>
          </Table.Header>
          <Table.Body items={rows}>
            {(row) => (
              <Table.Row id={row.key}>
                <Table.Cell>
                  <span className="mr-1.5 text-xs tabular-nums text-muted">
                    {formatNumber(row.number)}
                  </span>
                  {row.label}
                </Table.Cell>
                <Table.Cell className="text-muted">
                  {row.pillarLabel}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatNumber(row.weight)} pts
                </Table.Cell>
                <Table.Cell>
                  {row.known ? (
                    <ScoreBadge score={row.score} />
                  ) : (
                    <span className="text-muted">{UNKNOWN_TEXT}</span>
                  )}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {row.known ? (
                    formatRawValue(row.rawValue, row.unit)
                  ) : (
                    <span className="text-muted">{UNKNOWN_TEXT}</span>
                  )}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {row.known && row.contribution !== null ? (
                    `${formatNumber(row.contribution, 2)} pts`
                  ) : (
                    <span className="text-muted">{UNKNOWN_TEXT}</span>
                  )}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
