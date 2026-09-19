'use client';

import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { ShareBar } from '@/components/pulse/variable/detail/share-bar';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { formatEuro, formatMonth, formatPercent } from '@/lib/format';
import type {
  CreditLine,
  LocUtilDetail as LocUtilBlock,
} from '@/lib/pulse/details/types';
import { utilisationBand } from '@/lib/pulse/details/bands';
import { lastDetailMonth } from '@/lib/pulse/details/view';

/** Top of the utilisation track: a line can be drawn past its limit. */
const UTIL_MAX = 1.5;

const LINE_COLUMNS: readonly DataTableColumn<CreditLine>[] = [
  {
    id: 'line',
    header: 'Línea',
    isRowHeader: true,
    sortBy: (row) => `${row.bank} ${row.label}`,
    cell: (row) => `${row.bank} · ${row.label}`,
  },
  {
    id: 'drawn',
    header: 'Dispuesto',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.drawn,
    cell: (row) => formatEuro(row.drawn),
  },
  {
    id: 'limit',
    header: 'Límite',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.limit,
    cell: (row) => formatEuro(row.limit),
  },
  {
    id: 'util',
    header: 'Utilización',
    sortBy: (row) => row.util,
    cell: (row) => {
      const band = utilisationBand(row.util);
      return (
        <span className="flex items-center gap-2">
          <ShareBar
            value={row.util}
            max={UTIL_MAX}
            guide={1}
            color={band.color}
            label={`${formatPercent(row.util)} del límite, ${band.label}`}
          />
          <span
            className="font-medium tabular-nums"
            style={{ color: band.color }}
          >
            {formatPercent(row.util)}
          </span>
        </span>
      );
    },
  },
];

interface LocUtilDetailProps {
  block: LocUtilBlock;
  /** Reference month of the export, as `YYYY-MM`. */
  month: string;
}

/**
 * Lists the credit lines of the company with what is drawn on each one.
 *
 * The track runs to 150 % with the limit marked, because a line drawn past
 * its limit is the case the variable punishes hardest and it has to stay
 * visible on the same scale as a line that is still comfortable.
 *
 * @param props - The block and its reference month.
 * @returns The lines, the legend of the bands and the total of the month.
 */
export function LocUtilDetail({ block, month }: LocUtilDetailProps) {
  const { lines, months } = block;
  const last = lastDetailMonth(months);
  if (lines.length === 0) {
    return (
      <DetailNote>
        Sin líneas de crédito registradas: la variable no se calcula.
      </DetailNote>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Líneas de crédito y su utilización"
        columns={LINE_COLUMNS}
        rows={lines}
        rowId={(row) => row.productId}
        defaultSort={{ column: 'util', direction: 'descending' }}
      />
      <DetailNote>
        {`Total en ${formatMonth(month)}: ${formatEuro(last?.values.drawn ?? null)} dispuestos sobre ${formatEuro(last?.values.limit ?? null)} de límite, ${formatPercent(last?.values.util ?? null)}.`}
      </DetailNote>
      <DetailNote>
        Color de la utilización: hasta 50 % holgada, 50-80 % uso medio, 80-100 %
        cerca del límite, por encima del límite crítica. La marca del track es
        el 100 % del límite.
      </DetailNote>
    </div>
  );
}
