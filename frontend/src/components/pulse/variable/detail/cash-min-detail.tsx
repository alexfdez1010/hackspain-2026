'use client';

import { DailyBalanceChart } from '@/components/pulse/variable/detail/daily-balance-chart';
import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { MonthMinBars } from '@/components/pulse/variable/detail/month-min-bars';
import { formatEuro, formatMonth, formatNumber } from '@/lib/format';
import type { CashMinDetail as CashMinBlock } from '@/lib/pulse/details/types';
import { formatDay, lastDetailMonth } from '@/lib/pulse/details/view';

interface CashMinDetailProps {
  block: CashMinBlock;
  /** Reference month of the export, as `YYYY-MM`. */
  month: string;
}

/**
 * Shows the worst day of the month against its close.
 *
 * The daily series marks the minimum, and the small multiple repeats the
 * comparison month by month, so a close that looks comfortable next to a
 * minimum that is not cannot pass unnoticed.
 *
 * @param props - The block and its reference month.
 * @returns The daily chart, the reading of the month and the small multiple.
 */
export function CashMinDetail({ block, month }: CashMinDetailProps) {
  const { daily, minDay, months } = block;
  const last = lastDetailMonth(months);
  const close = last?.values.cashEnd ?? null;
  const ratio = last?.values.ratio ?? null;

  return (
    <div className="flex flex-col gap-6">
      <DailyBalanceChart
        daily={daily}
        mark={minDay}
        ariaLabel={`Saldo diario de caja con el peor día del cierre de ${formatMonth(month)}`}
      />
      <DetailNote>
        {minDay === null
          ? 'Sin mínimo diario registrado en el mes de cierre.'
          : `Peor día de ${formatMonth(month)}: ${formatDay(minDay.day)} con ${formatEuro(minDay.balance)}, frente a ${formatEuro(close)} al cierre; el mínimo cubre ${formatNumber(ratio, 2)} salidas mensuales.`}
      </DetailNote>
      <MonthMinBars months={months} />
    </div>
  );
}
