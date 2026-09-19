'use client';

import { Table } from '@heroui/react';

import { ScoreBadge } from '@/components/ui/score-badge';
import type { MethodExampleRow } from '@/lib/method/example';
import { formatNumber } from '@/lib/format';

interface MethodExampleTableProps {
  /** Variables with evidence, largest contribution first. */
  rows: readonly MethodExampleRow[];
}

/**
 * Lists the variables that built the score of one month, with the points each
 * one added.
 *
 * @param props - The rows of the worked example.
 * @returns The table of contributions.
 */
export function MethodExampleTable({ rows }: MethodExampleTableProps) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Aporte de cada variable al score del mes">
          <Table.Header>
            <Table.Column id="label" isRowHeader>
              Variable
            </Table.Column>
            <Table.Column id="pillar">Pilar</Table.Column>
            <Table.Column id="weight">Peso</Table.Column>
            <Table.Column id="score">Score 0-100</Table.Column>
            <Table.Column id="contribution">Aporte a PULSE</Table.Column>
          </Table.Header>
          <Table.Body items={rows}>
            {(row) => (
              <Table.Row id={row.key}>
                <Table.Cell>
                  <span className="mr-1.5 font-mono text-xs text-muted">
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
                  <ScoreBadge score={row.score} />
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatNumber(row.contribution, 2)}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
