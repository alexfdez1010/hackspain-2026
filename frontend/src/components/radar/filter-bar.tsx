'use client';

import { SearchField } from '@heroui/react';

import { FacetSelect, type FacetOption } from '@/components/radar/facet-select';
import { formatNumber } from '@/lib/xray/format';
import type { RadarFilters } from '@/lib/xray/radar-filters';
import { DIRECTION_LABELS, REGIME_LABELS, SCORE_BANDS } from '@/lib/xray/score';

const DIRECTION_OPTIONS: FacetOption[] = [
  { id: 'all', label: 'Toda dirección' },
  ...Object.entries(DIRECTION_LABELS).map(([id, label]) => ({ id, label })),
];

const REGIME_OPTIONS: FacetOption[] = [
  { id: 'all', label: 'Todo régimen' },
  ...Object.entries(REGIME_LABELS).map(([id, label]) => ({ id, label })),
];

const BAND_OPTIONS: FacetOption[] = [
  { id: 'all', label: 'Todo el score' },
  ...SCORE_BANDS.map((band) => ({ id: band.key, label: band.label })),
];

interface FilterBarProps {
  filters: RadarFilters;
  /** Receives the next filter state; the parent owns it. */
  onChange: (filters: RadarFilters) => void;
  /** Number of companies matching the current filters. */
  matches: number;
  /** Number of companies in the portfolio. */
  total: number;
}

/**
 * Renders the portfolio facets: free search plus direction, regime and score
 * band, with the live match count.
 *
 * @param props - Current filters, change handler and the match counts.
 * @returns The filter controls.
 */
export function FilterBar({
  filters,
  onChange,
  matches,
  total,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchField
        aria-label="Buscar empresa o grupo"
        value={filters.search}
        onChange={(search) => onChange({ ...filters, search })}
        className="w-full sm:w-60"
      >
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="COMP_0001 o GROUP_0147" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      <FacetSelect
        label="Dirección"
        options={DIRECTION_OPTIONS}
        selected={filters.direction}
        onSelect={(direction) =>
          onChange({
            ...filters,
            direction: direction as RadarFilters['direction'],
          })
        }
      />
      <FacetSelect
        label="Régimen"
        options={REGIME_OPTIONS}
        selected={filters.regime}
        className="w-48"
        onSelect={(regime) =>
          onChange({ ...filters, regime: regime as RadarFilters['regime'] })
        }
      />
      <FacetSelect
        label="Banda de score"
        options={BAND_OPTIONS}
        selected={filters.band}
        onSelect={(band) =>
          onChange({ ...filters, band: band as RadarFilters['band'] })
        }
      />

      <p className="text-sm text-muted" aria-live="polite">
        {formatNumber(matches)} de {formatNumber(total)} empresas
      </p>
    </div>
  );
}
