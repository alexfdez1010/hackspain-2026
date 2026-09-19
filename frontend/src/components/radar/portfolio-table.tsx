'use client';

import { Button, Table } from '@heroui/react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { FacetSelect, type FacetOption } from '@/components/radar/facet-select';
import { FilterBar } from '@/components/radar/filter-bar';
import { ScoreBadge } from '@/components/xray/score-badge';
import { DirectionTag, RegimeTag } from '@/components/xray/tags';
import { formatNumber, formatPercent, formatSigned } from '@/lib/xray/format';
import {
  EMPTY_FILTERS,
  selectRadarRows,
  type RadarFilters,
  type RadarSort,
  type RadarSortKey,
} from '@/lib/xray/radar-filters';
import type { RadarRow } from '@/lib/xray/selectors';

const PAGE_SIZE = 40;

const SORT_OPTIONS: FacetOption[] = [
  { id: 'score', label: 'Score' },
  { id: 'delta6m', label: 'Variación 6m' },
  { id: 'delta1m', label: 'Variación 1m' },
  { id: 'trend6m', label: 'Tendencia' },
  { id: 'pStress', label: 'Prob. estrés' },
  { id: 'id', label: 'Empresa' },
];

interface PortfolioTableProps {
  rows: readonly RadarRow[];
}

/**
 * Renders the ranked portfolio with its filters and ordering.
 *
 * Only the first {@link PAGE_SIZE} matches are mounted; the rest are revealed on
 * demand so the page stays responsive with 1.286 companies.
 *
 * @param props - Every company row, already projected on the server.
 * @returns The filter bar, the ranked table and the reveal control.
 */
export function PortfolioTable({ rows }: PortfolioTableProps) {
  const [filters, setFilters] = useState<RadarFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<RadarSort>({
    key: 'score',
    direction: 'asc',
  });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const matches = useMemo(
    () => selectRadarRows(rows, filters, sort),
    [rows, filters, sort],
  );
  const shown = matches.slice(0, visible);

  const applyFilters = (next: RadarFilters) => {
    setFilters(next);
    setVisible(PAGE_SIZE);
  };

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        filters={filters}
        onChange={applyFilters}
        matches={matches.length}
        total={rows.length}
      />

      <div className="flex flex-wrap items-center gap-3">
        <FacetSelect
          label="Ordenar por"
          options={SORT_OPTIONS}
          selected={sort.key}
          onSelect={(key) => setSort({ ...sort, key: key as RadarSortKey })}
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
          <Table.Content aria-label="Cartera puntuada">
            <Table.Header>
              <Table.Column id="id" isRowHeader>
                Empresa
              </Table.Column>
              <Table.Column id="score">Score</Table.Column>
              <Table.Column id="delta1m">Δ 1m</Table.Column>
              <Table.Column id="delta6m">Δ 6m</Table.Column>
              <Table.Column id="trend6m">Tendencia</Table.Column>
              <Table.Column id="direction">Dirección</Table.Column>
              <Table.Column id="regime">Régimen</Table.Column>
              <Table.Column id="pStress">Prob. estrés 6m</Table.Column>
            </Table.Header>
            <Table.Body items={shown}>
              {(row) => (
                <Table.Row id={row.id}>
                  <Table.Cell>
                    <Link
                      href={`/empresa/${row.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {row.id}
                    </Link>
                    <span className="block text-xs text-muted">
                      {row.group}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <ScoreBadge score={row.score} />
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatSigned(row.delta1m)}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatSigned(row.delta6m)}
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatSigned(row.trend6m, 2)}
                    <span className="block text-xs text-muted">pts/mes</span>
                  </Table.Cell>
                  <Table.Cell>
                    <DirectionTag direction={row.direction} />
                  </Table.Cell>
                  <Table.Cell>
                    <RegimeTag regime={row.regime} />
                  </Table.Cell>
                  <Table.Cell className="tabular-nums">
                    {formatPercent(row.pStress, 1)}
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {matches.length === 0 && (
        <p className="text-sm text-muted">
          Ninguna empresa cumple estos filtros.
        </p>
      )}

      {visible < matches.length && (
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onPress={() => setVisible(visible + PAGE_SIZE)}
          >
            Mostrar {Math.min(PAGE_SIZE, matches.length - visible)} más
          </Button>
          <span className="text-sm text-muted">
            {formatNumber(shown.length)} de {formatNumber(matches.length)}
          </span>
        </div>
      )}
    </div>
  );
}
