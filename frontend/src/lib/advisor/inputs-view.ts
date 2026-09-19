import { formatEuroExact, formatRate } from '@/lib/advisor/format';
import type { AdvisorHoldings, AdvisorInvoices } from '@/lib/advisor/types';
import { formatNumber } from '@/lib/format';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';

/** Spanish label of every facility type the ledger reports. */
export const HOLDING_TYPE_LABELS: Record<string, string> = {
  loan: 'préstamo',
  lineofcredit: 'línea de crédito',
  confirming: 'confirming',
  factoring: 'factoring',
  guarantee: 'aval',
  leasing: 'leasing',
  renting: 'renting',
  mortgage: 'hipoteca',
};

/** One figure of the input block, with the context needed to read it. */
export interface InputRow {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

/**
 * Renders an amount, keeping a zero apart from a missing figure.
 *
 * @param value - Amount in euros; `null` means the month has no evidence.
 * @returns The amount, or `sin datos`.
 */
function euroOrUnknown(value: number | null): string {
  return value === null ? UNKNOWN_TEXT : formatEuroExact(value);
}

/**
 * Names the facilities the company already holds.
 *
 * @param types - Facility types as published by the ledger.
 * @returns A Spanish enumeration, or the empty-state sentence.
 */
export function formatHoldingTypes(types: readonly string[]): string {
  if (types.length === 0) return 'Ninguno contratado';
  return types
    .map((type) => HOLDING_TYPE_LABELS[type] ?? type)
    .join(', ')
    .replace(/^./, (first) => first.toUpperCase());
}

/**
 * Builds the rows describing the facilities in force.
 *
 * @param holdings - Facilities of the company.
 * @returns Types, limit, drawn amount, loan balance and current rate.
 */
export function buildHoldingRows(holdings: AdvisorHoldings): InputRow[] {
  return [
    {
      key: 'types',
      label: 'Productos en vigor',
      value: formatHoldingTypes(holdings.types),
    },
    {
      key: 'line',
      label: 'Líneas de crédito',
      value: euroOrUnknown(holdings.lineLimit),
      hint: `Dispuesto ${euroOrUnknown(holdings.lineDrawn)}`,
    },
    {
      key: 'loans',
      label: 'Saldo vivo de préstamos',
      value: euroOrUnknown(holdings.loanOutstanding),
      hint:
        holdings.nLoans === null
          ? undefined
          : `${formatNumber(holdings.nLoans)} ${holdings.nLoans === 1 ? 'préstamo' : 'préstamos'}`,
    },
    {
      key: 'rate',
      label: 'Tipo que pagas hoy',
      value:
        holdings.currentRate === null
          ? UNKNOWN_TEXT
          : formatRate(holdings.currentRate),
      hint:
        holdings.currentRate === null
          ? 'El contrato no publica el tipo'
          : undefined,
    },
  ];
}

/**
 * Builds the rows describing the open invoices.
 *
 * Without an ERP connected there is no invoice ledger to read, so the figures
 * are absent rather than zero and the block says so in one line.
 *
 * @param invoices - Invoice figures of the company.
 * @returns One row when there is no ERP, five rows otherwise.
 */
export function buildInvoiceRows(invoices: AdvisorInvoices): InputRow[] {
  if (!invoices.hasErp) {
    return [
      {
        key: 'erp',
        label: 'Facturas',
        value: UNKNOWN_TEXT,
        hint: 'Sin ERP conectado: no hay cartera de facturas que leer',
      },
    ];
  }
  return [
    {
      key: 'open_ar',
      label: 'Facturas de clientes pendientes',
      value: euroOrUnknown(invoices.openAr),
      hint: `Anticipables ${euroOrUnknown(invoices.eligibleAr)}`,
    },
    {
      key: 'ar_monthly',
      label: 'Facturación mensual',
      value: euroOrUnknown(invoices.arMonthly),
    },
    {
      key: 'open_ap',
      label: 'Facturas de proveedores pendientes',
      value: euroOrUnknown(invoices.openAp),
    },
    {
      key: 'ap_monthly',
      label: 'Compras mensuales',
      value: euroOrUnknown(invoices.apMonthly),
    },
  ];
}
