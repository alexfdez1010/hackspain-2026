'use client';

import { useState, type CSSProperties } from 'react';

import { MosaicCell } from '@/components/pulse/mosaic-cell';
import { Panel } from '@/components/ui/panel';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseMosaic, PulseMosaicColumn } from '@/lib/pulse/mosaic';
import { formatNumber } from '@/lib/format';
import { SCORE_BANDS } from '@/lib/score';

/** Minimum width of the column that holds the open cell, in pixels. */
const OPEN_FLOOR = 280;

/** How much wider the open column grows, as a factor of its weight. */
const OPEN_GROWTH = 2.2;

interface MosaicColumnProps {
  column: PulseMosaicColumn;
  selectedKey: string;
  companyId: string;
  onSelect: (key: string) => void;
}

/**
 * One pillar of the mosaic: its name, the score it reached and its variables.
 *
 * The header keeps the only hairline of the column, because it is the one
 * place where two readings meet: the score of the pillar above and the cells
 * that make it below. The overline reserves two lines of height so the four
 * pillar scores sit on the same baseline whatever their name measures.
 *
 * @param props - The column, the selected variable, the company and the handler.
 * @returns The column.
 */
function MosaicColumn({
  column,
  selectedKey,
  companyId,
  onSelect,
}: MosaicColumnProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="border-hairline mb-3.5 flex min-h-[92px] flex-col justify-start gap-2 border-b pb-3.5">
        <b className="text-ink-secondary block min-h-[34px] text-[13px] leading-[1.3] font-semibold tracking-[0.04em] uppercase">
          {column.label}
        </b>
        <span className="flex items-baseline gap-2">
          <b className="text-2xl leading-[1.1] font-semibold tracking-[-0.01em] tabular-nums">
            {column.score === null ? '—' : formatNumber(column.score, 1)}
          </b>
          <em className="text-ink-secondary text-[13px] leading-[1.45] not-italic">
            {column.score === null
              ? UNKNOWN_TEXT
              : column.band.name.toLowerCase()}
          </em>
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {column.cells.map((cell) => (
          <MosaicCell
            key={cell.key}
            cell={cell}
            selected={cell.key === selectedKey}
            companyId={companyId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

interface PulseVariableMosaicProps {
  mosaic: PulseMosaic;
  companyId: string;
}

/**
 * Where the score is decided: the eleven variables of the last close, laid out
 * as four pillar columns as wide as the pillar weighs and cells as tall as the
 * variable weighs, coloured by the band each one reached.
 *
 * Picking a cell opens its reading inside the cell itself, and the column that
 * holds it takes more than twice its weight in width: the mosaic makes room
 * where the reader pressed instead of sending them to a panel at the foot of
 * the page, so the map of the month never leaves the screen. The widths are
 * animated, and only there, because the layout moving is the one thing the
 * reader has to follow; the figures themselves never animate.
 *
 * Under `md` the four columns become four rows and the width template does not
 * apply, which keeps every cell readable on a phone without a sideways scroll.
 *
 * @param props - The mosaic of the month and the company in context.
 * @returns The mosaic and its legend.
 */
export function PulseVariableMosaic({
  mosaic,
  companyId,
}: PulseVariableMosaicProps) {
  const first = mosaic.columns[0]?.cells[0]?.key ?? '';
  const [selectedKey, setSelectedKey] = useState(first);
  const selected =
    mosaic.cells.find((cell) => cell.key === selectedKey) ?? mosaic.cells[0];

  if (!selected) {
    return (
      <Panel>
        <p className="text-ink-secondary text-sm">
          Sin mes observado: el mosaico se dibuja con el primer cierre.
        </p>
      </Panel>
    );
  }

  const template = mosaic.columns
    .map((column) => {
      const open = column.key === selected.pillar;
      const floor = open ? OPEN_FLOOR : column.weight <= 12 ? 150 : 130;
      const share = open
        ? (column.weight * OPEN_GROWTH).toFixed(2)
        : column.weight;
      return `minmax(${floor}px,${share}fr)`;
    })
    .join(' ');

  return (
    <Panel>
      <div
        style={{ '--mosaic-columns': template } as CSSProperties}
        className="grid grid-cols-1 items-start gap-4 md:grid-cols-[var(--mosaic-columns)] md:motion-safe:transition-[grid-template-columns] md:motion-safe:duration-200 md:motion-safe:ease-out"
      >
        {mosaic.columns.map((column) => (
          <MosaicColumn
            key={column.key}
            column={column}
            selectedKey={selected.key}
            companyId={companyId}
            onSelect={setSelectedKey}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
        {SCORE_BANDS.map((band) => (
          <span
            key={band.key}
            className="text-ink-secondary inline-flex items-center gap-2 text-[13px]"
          >
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: band.color }}
            />
            {band.label}
          </span>
        ))}
        {mosaic.unknownCount > 0 && (
          <span className="text-ink-secondary inline-flex items-center gap-2 text-[13px]">
            <span
              aria-hidden
              className="border-hairline-strong bg-surface-secondary size-2 rounded-full border"
            />
            {formatNumber(mosaic.unknownCount)} sin datos
          </span>
        )}
      </div>
    </Panel>
  );
}
