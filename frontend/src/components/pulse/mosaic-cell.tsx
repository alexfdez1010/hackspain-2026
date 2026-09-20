'use client';

import Link from 'next/link';

import { VariableInfoMark } from '@/components/charts/variable-info-mark';
import { bandRange, bandTint } from '@/lib/pulse/band';
import { formatRawValue, UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseMosaicCell } from '@/lib/pulse/mosaic';
import { formatNumber } from '@/lib/format';
import { companyVariableRoute } from '@/lib/routes';

/** Pixels of height each point of weight buys a cell. */
export const PIXELS_PER_POINT = 13;

/** Share of the band colour a cell keeps, resting and selected. */
const TINT = { rest: 12, selected: 22 } as const;

/** One figure of the detail that opens inside the selected cell. */
interface CellFact {
  key: string;
  value: string;
  label: string;
}

/**
 * Builds the four figures that explain the selected cell: what the month
 * measured, what it put into the score, which band it fell in and how much of
 * the model it owns.
 *
 * They are the whole chain from the raw magnitude to the points of PULSE, so
 * the reader can check the arithmetic of the cell they just clicked instead of
 * trusting the colour. A variable with no evidence says so in each figure
 * rather than showing a zero it never scored.
 *
 * @param cell - The selected variable.
 * @returns The four figures, in reading order.
 */
function buildFacts(cell: PulseMosaicCell): CellFact[] {
  return [
    {
      key: 'raw',
      value: cell.known
        ? formatRawValue(cell.rawValue, cell.unit)
        : 'Sin dato este mes',
      label: 'Valor de hoy',
    },
    {
      key: 'contribution',
      value: `${formatNumber(cell.contribution ?? 0, 2)} pts`,
      label: 'Aporta al PULSE',
    },
    {
      key: 'band',
      value: cell.known ? cell.band.name : UNKNOWN_TEXT,
      label: cell.known ? bandRange(cell.band) : 'no puntúa este mes',
    },
    {
      key: 'weight',
      value: `${formatNumber(cell.weight)} de 100`,
      label: 'Peso',
    },
  ];
}

interface MosaicCellProps {
  cell: PulseMosaicCell;
  selected: boolean;
  companyId: string;
  onSelect: (key: string) => void;
}

/**
 * One variable of the mosaic: a card as tall as the variable weighs that opens
 * its own reading when it is picked.
 *
 * Height carries the weight and the band tints the whole card, so the severity
 * of a month reads at a glance across the mosaic without a dot repeating what
 * the surface already says. The tint is what groups a cell, so a measured cell
 * draws no hairline and the only border left in the mosaic is the brand blue
 * of the selected card: picking a variable is the single piece of state the
 * border has to carry. A variable with no evidence keeps a grey surface and
 * says «—» instead of a zero, because an unmeasured variable is not a bad one:
 * it is one the month had to leave out.
 *
 * The detail opens inside the card, under the score, instead of in a panel at
 * the foot of the mosaic: the figures land where the eye already is and the
 * map of the month stays on screen while the reader walks it. Only one
 * hairline survives there, the one that separates the score from its
 * explanation. That reading holds a link to the full variable, so the card is
 * a plain `div` with the button on top: a link cannot live inside a button.
 * The same reason puts the variable's info mark on the card and not in the
 * button: it sits in the top-right corner, over the label's right inset, and
 * after the button in the document so the cell keeps its place in the order.
 *
 * @param props - The cell, whether it is selected, the company and the handler.
 * @returns The cell card.
 */
export function MosaicCell({
  cell,
  selected,
  companyId,
  onSelect,
}: MosaicCellProps) {
  const ink = cell.known ? 'text-ink' : 'text-ink-secondary';
  const background = cell.known
    ? bandTint(cell.score, selected ? TINT.selected : TINT.rest)
    : undefined;
  return (
    <div
      style={{ background }}
      className={`relative flex flex-col rounded-lg border px-3.5 py-3 ${
        selected
          ? 'border-[var(--brand-blue,var(--accent))]'
          : 'border-transparent'
      } ${cell.known ? '' : 'bg-surface-secondary'}`.trim()}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(cell.key)}
        style={{ minHeight: `${cell.weight * PIXELS_PER_POINT}px` }}
        className="flex w-full flex-col justify-between gap-2 text-left"
      >
        <span className={`pr-6 text-sm leading-tight font-medium ${ink}`}>
          {cell.label}
        </span>
        <span className="flex w-full items-baseline justify-between gap-2.5">
          <span
            className={`text-xl leading-none font-semibold tracking-[-0.01em] tabular-nums ${ink}`}
          >
            {cell.known ? formatNumber(cell.score, 1) : '—'}
          </span>
          <span className="text-ink-secondary text-[13px] whitespace-nowrap">
            {formatNumber(cell.weight)} pts
          </span>
        </span>
      </button>
      <VariableInfoMark
        variableKey={cell.key}
        label={cell.label}
        weight={cell.weight}
        className="absolute top-2 right-2"
      />
      {selected && (
        <div className="border-hairline mt-1 border-t pt-3.5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-x-5 gap-y-3.5">
            {buildFacts(cell).map((fact) => (
              <span key={fact.key}>
                <b className="block text-[17px] leading-[1.3] font-semibold tabular-nums">
                  {fact.value}
                </b>
                <small className="text-ink-secondary mt-[3px] block text-[12px] leading-[1.4]">
                  {fact.label}
                </small>
              </span>
            ))}
          </div>
          <Link
            href={companyVariableRoute(companyId, cell.key)}
            className="group text-ink mt-3.5 inline-flex items-center gap-1.5 text-[15px] font-medium"
          >
            Ver la variable
            <span
              aria-hidden
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
