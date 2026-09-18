import {
  formatEuro,
  formatMonth,
  formatNumber,
  formatPercent,
} from '@/lib/xray/format';
import type { RawKpis } from '@/lib/xray/types';

type Formatter = (value: number | null) => string;

interface KpiSpec {
  key: keyof RawKpis;
  label: string;
  format: Formatter;
}

const days: Formatter = (value) =>
  value === null ? '—' : `${formatNumber(value, 1)} d`;
const count: Formatter = (value) => formatNumber(value);

const KPI_GROUPS: { title: string; items: KpiSpec[] }[] = [
  {
    title: 'Caja',
    items: [
      { key: 'inflow', label: 'Cobros del mes', format: formatEuro },
      { key: 'outflow', label: 'Pagos del mes', format: formatEuro },
      { key: 'net', label: 'Caja neta', format: formatEuro },
      { key: 'cash_end', label: 'Saldo a cierre', format: formatEuro },
    ],
  },
  {
    title: 'Cobros y pagos',
    items: [
      { key: 'dso_days', label: 'DSO', format: days },
      {
        key: 'supplier_delay_days',
        label: 'Retraso a proveedores',
        format: days,
      },
      {
        key: 'overdue_ar',
        label: 'Facturas de cliente vencidas',
        format: formatEuro,
      },
      {
        key: 'overdue_ap',
        label: 'Facturas de proveedor vencidas',
        format: formatEuro,
      },
    ],
  },
  {
    title: 'Financiación e incidencias',
    items: [
      {
        key: 'loc_utilization',
        label: 'Uso de líneas de crédito',
        format: (value) => formatPercent(value, 1),
      },
      { key: 'debt_outstanding', label: 'Deuda viva', format: formatEuro },
      { key: 'returned_debit_n', label: 'Recibos devueltos', format: count },
      { key: 'stress_n', label: 'Eventos de estrés', format: count },
    ],
  },
];

interface KpiTableProps {
  raw: RawKpis;
  /** Month the figures belong to, as `YYYY-MM`. */
  month: string;
}

/**
 * Lists the raw bank figures behind the score for the latest month.
 *
 * They are grouped the way a treasurer reads them — cash first, then the
 * collection and payment behaviour, then financing and incidents.
 *
 * @param props - The raw KPIs and their month.
 * @returns Three definition lists of figures.
 */
export function KpiTable({ raw, month }: KpiTableProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">Datos de {formatMonth(month)}.</p>
      <div className="grid gap-x-10 gap-y-6 sm:grid-cols-3">
        {KPI_GROUPS.map((group) => (
          <dl key={group.title} className="flex flex-col gap-2 text-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              {group.title}
            </p>
            {group.items.map((item) => (
              <div key={item.key} className="flex justify-between gap-4">
                <dt className="text-muted">{item.label}</dt>
                <dd className="tabular-nums">{item.format(raw[item.key])}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
    </div>
  );
}
