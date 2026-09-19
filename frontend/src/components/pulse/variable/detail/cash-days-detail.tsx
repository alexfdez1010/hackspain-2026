'use client';

import { DailyBalanceChart } from '@/components/pulse/variable/detail/daily-balance-chart';
import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { formatEuro, formatMonth } from '@/lib/format';
import type {
  CashAccount,
  CashDaysDetail as CashDaysBlock,
} from '@/lib/pulse/details/types';

/** Days of operating outflow the dashed reference stands for. */
const DAYS_PER_MONTH = 30;

const ACCOUNT_COLUMNS: readonly DataTableColumn<CashAccount>[] = [
  {
    id: 'account',
    header: 'Cuenta',
    isRowHeader: true,
    sortBy: (row) => `${row.bank} ${row.label}`,
    cell: (row) => `${row.bank} · ${row.label}`,
  },
  {
    id: 'type',
    header: 'Tipo',
    sortBy: (row) => row.type,
    cell: (row) => row.type,
  },
  {
    id: 'balance',
    header: 'Saldo',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.balance,
    cell: (row) => formatEuro(row.balance),
  },
];

interface CashDaysDetailProps {
  block: CashDaysBlock;
  /** Reference month of the export, as `YYYY-MM`. */
  month: string;
}

/**
 * Shows the cash behind «días de caja»: the daily balance of the last two
 * months against one month of operating outflow, and the accounts that add
 * up to the balance of the close.
 *
 * @param props - The block and its reference month.
 * @returns The chart, the outflow sentence and the accounts.
 */
export function CashDaysDetail({ block, month }: CashDaysDetailProps) {
  const { daily, dailyOutflow, accounts } = block;
  const monthly = dailyOutflow === null ? null : dailyOutflow * DAYS_PER_MONTH;

  return (
    <div className="flex flex-col gap-6">
      <DailyBalanceChart
        daily={daily}
        guide={
          monthly === null
            ? null
            : { value: monthly, label: 'un mes de salidas' }
        }
        ariaLabel={`Saldo diario de caja hasta el cierre de ${formatMonth(month)}`}
      />
      <DetailNote>
        {dailyOutflow === null
          ? 'Sin salida operativa medida: la variable no se calcula este mes.'
          : `Salida operativa: ${formatEuro(dailyOutflow)} al día, ${formatEuro(monthly)} al mes.`}
      </DetailNote>
      {accounts.length === 0 ? (
        <DetailNote>Sin cuentas bancarias registradas.</DetailNote>
      ) : (
        <DataTable
          aria-label="Cuentas de caja al cierre del mes"
          columns={ACCOUNT_COLUMNS}
          rows={accounts}
          rowId={(row) => row.productId}
          defaultSort={{ column: 'balance', direction: 'descending' }}
        />
      )}
    </div>
  );
}
