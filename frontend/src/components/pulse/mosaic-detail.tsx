import Link from 'next/link';

import { FactGrid, type PulseFact } from '@/components/pulse/fact-grid';
import { Panel } from '@/components/ui/panel';
import { bandRange, NO_DATA_COLOR } from '@/lib/pulse/band';
import { formatRawValue, UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseMosaicCell } from '@/lib/pulse/mosaic';
import { formatNumber } from '@/lib/format';
import { companyVariableRoute } from '@/lib/routes';

/**
 * Builds the five figures that explain one cell of the mosaic.
 *
 * @param cell - The selected variable.
 * @returns The figures, from the raw magnitude to the weight in the model.
 */
function buildFacts(cell: PulseMosaicCell): PulseFact[] {
  const known = cell.known;
  return [
    {
      key: 'raw',
      label: 'Valor medido',
      value: known ? formatRawValue(cell.rawValue, cell.unit) : 'Sin datos',
    },
    {
      key: 'score',
      label: 'Score sobre 100',
      value: known ? formatNumber(cell.score, 1) : '—',
    },
    {
      key: 'contribution',
      label: 'Aporta al PULSE',
      value: `${formatNumber(cell.contribution ?? 0, 2)} pts`,
    },
    {
      key: 'band',
      label: known ? `Banda ${bandRange(cell.band)}` : 'No puntúa este mes',
      value: (
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{
              background: known ? cell.band.color : NO_DATA_COLOR,
            }}
          />
          {known ? cell.band.name : UNKNOWN_TEXT}
        </span>
      ),
    },
    {
      key: 'weight',
      label: 'Peso en el modelo',
      value: `${formatNumber(cell.weight)} de 100`,
    },
  ];
}

interface MosaicDetailProps {
  cell: PulseMosaicCell;
  companyId: string;
}

/**
 * Reads the variable picked in the mosaic: what it measured, what it scored,
 * how many points of PULSE it put in and how much of the model it owns.
 *
 * The five figures are the whole chain from the raw magnitude to the points
 * the score gained, so the reader can check the arithmetic of the cell they
 * just clicked instead of trusting the colour.
 *
 * @param props - The selected cell and the company in context.
 * @returns The detail strip.
 */
export function MosaicDetail({ cell, companyId }: MosaicDetailProps) {
  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
        <span>
          <b className="block font-medium">{cell.label}</b>
          <span className="text-ink-secondary mt-0.5 block text-[13px]">
            Pilar de {cell.pillarLabel.toLowerCase()}
          </span>
        </span>
        <span className="text-ink-secondary text-[13px]">
          Pulsa cualquier celda del mosaico para cambiar de variable
        </span>
      </div>
      <FactGrid items={buildFacts(cell)} />
      <Link
        href={companyVariableRoute(companyId, cell.key)}
        className="group mt-4 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink"
      >
        Ver la variable
        <span
          aria-hidden
          className="inline-block transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      </Link>
    </Panel>
  );
}
