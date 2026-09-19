'use client';

import { Button, Table } from '@heroui/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { FacetSelect, type FacetOption } from '@/components/radar/facet-select';
import { ScoreBadge } from '@/components/xray/score-badge';
import { formatBand, formatConfidence } from '@/lib/pulse/format';
import {
  DEFAULT_PULSE_SORT,
  forecastDelta,
  monthlyChange,
  sortPulseRows,
  type PulseSort,
  type PulseSortKey,
} from '@/lib/pulse/selectors';
import type { PulseCompanyRow } from '@/lib/pulse/types';
import { formatNumber, formatSigned } from '@/lib/xray/format';

const PAGE_SIZE = 40;

const SORT_OPTIONS: FacetOption[] = [
  { id: 'pulse', label: 'PULSE' },
  { id: 'change', label: 'Variación mensual' },
  { id: 'forecastDelta', label: 'Variación prevista +6 m' },
  { id: 'id', label: 'Empresa' },
];

interface PulsePortfolioTableProps {
  rows: readonly PulseCompanyRow[];
}

/**
 * Ranks the portfolio by PULSE, by its monthly change or by the change the
 * six-month forecast implies.
 *
 * Only the first {@link PAGE_SIZE} rows are mounted; the rest are revealed on
 * demand so the page stays responsive with 1.285 companies.
 *
 * @param props - Every company row, projected on the server.
 * @returns The ordering controls, the ranked table and the reveal control.
 */
export function PulsePortfolioTable({ rows }: PulsePortfolioTableProps) {
  const [sort, setSort] = useState<PulseSort>(DEFAULT_PULSE_SORT);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const ordered = useMemo(() => sortPulseRows(rows, sort), [rows, sort]);
  const shown = ordered.slice(0, visible);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FacetSelect
          label="Ordenar por"
          options={SORT_OPTIONS}
          selected={sort.key}
          onSelect={(key) => setSort({ ...sort, key: key as PulseSortKey })}
          className="w-56"
        />
        <Button
          variant="tertiary"
          size="sm"
          onPress={() =>
            setSort({
              ...sort,
              direction: sort.direction === 'asc' ? 'desc' : 'asc',
            })
          }
        >
          {sort.direction === 'asc' ? 'Ascendente' : 'Descendente'}
        </Button>
      </div>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Cartera puntuada con PULSE">
            <Table.Header>
              <Table.Column id="id" isRowHeader>
                Empresa
              </Table.Column>
              <Table.Column id="pulse">PULSE</Table.Column>
              <Table.Column id="change">Δ mes</Table.Column>
              <Table.Column id="confidence">Confianza</Table.Column>
              <Table.Column id="forecast">Previsión +6 m</Table.Column>
              <Table.Column id="forecastDelta">Δ previsto</Table.Column>
            </Table.Header>
            <Table.Body items={shown}>
              {(row) => (
                <Table.Row id={row.companyId}>
                  <Table.Cell>
                    <Link
                      href={`/pulse/${row.companyId}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {row.companyId}
                    </Link>
                    <span className="block text-xs text-muted">
                      {row.groupId}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <ScoreBadge score={row.pulse} />
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatSigned(monthlyChange(row))}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatConfidence(row.confidence)}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatNumber(row.forecast6m?.pulsePred ?? null, 1)}
                    <span className="block text-xs text-muted">
                      {formatBand(
                        row.forecast6m?.pulseP10 ?? null,
                        row.forecast6m?.pulseP90 ?? null,
                      )}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatSigned(forecastDelta(row))}
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {visible < ordered.length && (
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onPress={() => setVisible(visible + PAGE_SIZE)}
          >
            Mostrar {Math.min(PAGE_SIZE, ordered.length - visible)} más
          </Button>
          <span className="text-sm text-muted" aria-live="polite">
            {formatNumber(shown.length)} de {formatNumber(ordered.length)}
          </span>
        </div>
      )}
    </div>
  );
}
