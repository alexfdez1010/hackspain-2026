'use client';

import { useState, type CSSProperties } from 'react';

import { MosaicCell } from '@/components/pulse/mosaic-cell';
import { MosaicDetail } from '@/components/pulse/mosaic-detail';
import { Panel } from '@/components/ui/panel';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseMosaic, PulseMosaicColumn } from '@/lib/pulse/mosaic';
import { formatNumber } from '@/lib/format';
import { SCORE_BANDS } from '@/lib/score';

interface MosaicColumnProps {
  column: PulseMosaicColumn;
  selectedKey: string;
  onSelect: (key: string) => void;
}

/**
 * One pillar of the mosaic: its name, the score it reached and its variables.
 *
 * @param props - The column, the selected variable and the handler.
 * @returns The column.
 */
function MosaicColumn({ column, selectedKey, onSelect }: MosaicColumnProps) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="border-hairline mb-3.5 flex min-h-[92px] flex-col justify-end gap-1.5 border-b pb-3.5">
        <b className="text-ink-secondary text-[13px] leading-[1.3] font-semibold tracking-[0.04em] uppercase">
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
 * Picking a cell opens it underneath instead of navigating away, so the reader
 * can walk the whole month without losing the map. Under `md` the four columns
 * become four rows, which keeps every cell readable on a phone without a
 * sideways scroll.
 *
 * @param props - The mosaic of the month and the company in context.
 * @returns The mosaic, its legend and the detail of the selected variable.
 */
export function PulseVariableMosaic({
  mosaic,
  companyId,
}: PulseVariableMosaicProps) {
  const first = mosaic.columns[0]?.cells[0]?.key ?? '';
  const [selectedKey, setSelectedKey] = useState(first);
  const selected =
    mosaic.cells.find((cell) => cell.key === selectedKey) ?? mosaic.cells[0];
  const template = mosaic.columns
    .map(
      (column, index) =>
        `minmax(${index === mosaic.columns.length - 1 ? 170 : 150}px,${column.weight}fr)`,
    )
    .join(' ');

  if (!selected) {
    return (
      <Panel>
        <p className="text-sm text-ink-secondary">
          Sin mes observado: el mosaico se dibuja con el primer cierre.
        </p>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <div
          style={{ '--mosaic-columns': template } as CSSProperties}
          className="grid grid-cols-1 items-start gap-4 md:grid-cols-[var(--mosaic-columns)]"
        >
          {mosaic.columns.map((column) => (
            <MosaicColumn
              key={column.key}
              column={column}
              selectedKey={selected.key}
              onSelect={setSelectedKey}
            />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-5 border-t border-hairline pt-4">
          {SCORE_BANDS.map((band) => (
            <span
              key={band.key}
              className="inline-flex items-center gap-2 text-[13px] text-ink-secondary"
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
            <span className="inline-flex items-center gap-2 text-[13px] text-ink-secondary">
              <span
                aria-hidden
                className="size-2 rounded-full border border-hairline-strong bg-surface-secondary"
              />
              {formatNumber(mosaic.unknownCount)} sin datos
            </span>
          )}
        </div>
      </Panel>
      <MosaicDetail cell={selected} companyId={companyId} />
    </div>
  );
}
