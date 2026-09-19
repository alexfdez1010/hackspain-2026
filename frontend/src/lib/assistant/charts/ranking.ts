import type { RankingKind, RankingRow } from '@/lib/assistant/charts/types';
import { counterpartyName } from '@/lib/company/names';
import { formatEuro, formatNumber, formatPercent } from '@/lib/format';
import { lateDaysHint } from '@/lib/pulse/details/view';
import type { PulseCompanyDetails } from '@/lib/pulse/details/types';
import { scoreColor } from '@/lib/score';

/** Spanish names of the aging buckets of the export. */
const AGING_LABELS: Record<string, string> = {
  al_dia: 'Al día',
  '1_30': '1 a 30 días',
  '31_60': '31 a 60 días',
  '61_90': '61 a 90 días',
  mas_90: 'Más de 90 días',
};

/** Name of the magnitude every ranking compares. */
export const RANKING_MEASURES: Record<RankingKind, string> = {
  clientes_dso: 'Días que tarda en pagar cada cliente',
  clientes_cobros: 'Cobrado por cliente en el último trimestre',
  proveedores_dpo: 'Días que se tarda en pagar a cada proveedor',
  proveedores_pagos: 'Pagado a cada proveedor en el último trimestre',
  morosidad: 'Cartera vencida más de 90 días por cliente',
  concentracion: 'Facturación por cliente en el último trimestre',
  lineas: 'Utilización de cada línea de crédito',
  deuda: 'Deuda pendiente por producto',
  red: 'Salud de pago de cada cliente en toda la red',
  antiguedad: 'Cartera pendiente por antigüedad',
};

/** Days rendered with one decimal. */
function days(value: number | null): string {
  return value === null ? 'sin datos' : `${formatNumber(value, 1)} días`;
}

/** Invoice count rendered as a detail. */
function invoices(value: number | null): string {
  return value === null ? '' : `${formatNumber(value)} facturas`;
}

/** A row that carries no magnitude. */
function euroRow(
  id: string,
  label: string,
  value: number | null,
  detail: string,
): RankingRow {
  return {
    id,
    label,
    value,
    valueText: formatEuro(value),
    detail,
    color: null,
  };
}

/**
 * Builds the rows of one ranking from the detail export, largest first.
 *
 * Counterparties are named with their stable trade name; identifiers never
 * reach the chart or the model. Lists are already capped by the export.
 *
 * @param details - Detail of every variable of the company.
 * @param ranking - Ranking to build.
 * @returns The name of the measure and the rows, ordered by magnitude.
 */
export function buildRankingRows(
  details: PulseCompanyDetails,
  ranking: RankingKind,
): { measure: string; rows: RankingRow[] } {
  const v = details.variables;
  const measure = RANKING_MEASURES[ranking];
  let rows: RankingRow[];
  switch (ranking) {
    case 'clientes_dso':
      rows = v.dso.customers.map((c) => ({
        id: c.counterpartyId,
        label: counterpartyName(c.counterpartyId),
        value: c.dsoDays,
        valueText: days(c.dsoDays),
        detail: lateDaysHint(c.lateDays, 'customer'),
        color: null,
      }));
      break;
    case 'clientes_cobros':
      rows = v.dso.customers.map((c) =>
        euroRow(
          c.counterpartyId,
          counterpartyName(c.counterpartyId),
          c.collected3m,
          invoices(c.invoices),
        ),
      );
      break;
    case 'proveedores_dpo':
      rows = v.dpo.suppliers.map((s) => ({
        id: s.counterpartyId,
        label: counterpartyName(s.counterpartyId),
        value: s.dpoDays,
        valueText: days(s.dpoDays),
        detail: lateDaysHint(s.lateDays, 'supplier'),
        color: null,
      }));
      break;
    case 'proveedores_pagos':
      rows = v.dpo.suppliers.map((s) =>
        euroRow(
          s.counterpartyId,
          counterpartyName(s.counterpartyId),
          s.paid3m,
          invoices(s.invoices),
        ),
      );
      break;
    case 'morosidad':
      rows = v.ar90.debtors.map((d) =>
        euroRow(
          d.counterpartyId,
          counterpartyName(d.counterpartyId),
          d.over90,
          d.shareOver90 === null
            ? ''
            : `${formatPercent(d.shareOver90)} de su cartera abierta`,
        ),
      );
      break;
    case 'concentracion':
      rows = v.top_client.customers.map((c) => ({
        ...euroRow(
          c.counterpartyId,
          counterpartyName(c.counterpartyId),
          c.billed3m,
          c.growth === null
            ? ''
            : `${formatPercent(c.growth)} frente al trimestre anterior`,
        ),
        color: c.top ? 'var(--brand-blue)' : null,
      }));
      break;
    case 'lineas':
      rows = v.loc_util.lines.map((l) => ({
        id: l.productId,
        label: `${l.bank} · ${l.label}`,
        value: l.util,
        valueText: l.util === null ? 'sin datos' : formatPercent(l.util),
        detail: `${formatEuro(l.drawn)} de ${formatEuro(l.limit)}`,
        color: l.util !== null && l.util > 0.8 ? 'var(--score-critical)' : null,
      }));
      break;
    case 'deuda':
      rows = v.maturities.products.map((p) =>
        euroRow(
          p.productId,
          `${p.bank} · ${p.label}`,
          p.outstanding,
          p.periodsLeft === null
            ? p.type
            : `${formatNumber(p.periodsLeft)} cuotas pendientes`,
        ),
      );
      break;
    case 'red':
      rows = v.network.customers.map((c) => ({
        id: c.counterpartyId,
        label: counterpartyName(c.counterpartyId),
        value: c.health,
        valueText: c.health === null ? 'sin datos' : formatPercent(c.health),
        detail:
          c.share === null ? '' : `${formatPercent(c.share)} de la facturación`,
        color: c.health === null ? null : scoreColor(c.health * 100),
      }));
      break;
    case 'antiguedad':
      rows = v.ar90.aging.map((bucket) => ({
        ...euroRow(
          bucket.bucket,
          AGING_LABELS[bucket.bucket] ?? bucket.bucket,
          bucket.amount,
          invoices(bucket.invoices),
        ),
        color: bucket.bucket === 'mas_90' ? 'var(--score-critical)' : null,
      }));
      return { measure, rows };
  }
  rows.sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  return { measure, rows };
}
