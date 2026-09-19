import type {
  AdvisorPricingParameters,
  AdvisorProduct,
  AdvisorReferenceRate,
} from '@/lib/advisor/types';
import { formatNumber, formatPercent, formatSigned } from '@/lib/format';

/** Whether a step starts the price, adds to it or closes it. */
export type MethodPriceRole = 'base' | 'add' | 'total';

/** One line of the price, as the method page explains it. */
export interface MethodPriceStep {
  key: string;
  role: MethodPriceRole;
  label: string;
  /** The amount or the formula behind it, already formatted. */
  amount: string;
  /** Where the number comes from and what bounds it. */
  detail: string;
}

/**
 * Renders the margin band of the catalogue.
 *
 * @param products - Products of the catalogue.
 * @returns A range such as `90 a 200 pb`, or a fallback when the catalogue is
 * empty.
 */
function marginRange(products: readonly AdvisorProduct[]): string {
  const spreads = products
    .filter((product) => product.rateKind === 'cost')
    .map((product) => product.baseSpreadBps);
  if (spreads.length === 0) return 'fijo por producto';
  return `${formatNumber(Math.min(...spreads))} a ${formatNumber(Math.max(...spreads))} pb`;
}

/**
 * Builds the stack that turns a score into an annual rate.
 *
 * Every constant comes from the published catalogue, so the page cannot drift
 * from the backend that prices the offer.
 *
 * @param params - Pricing constants of the catalogue.
 * @param reference - Risk-free rate every cost product is priced over.
 * @param products - Products, read for the margin band.
 * @returns The lines of the price, in the order they are added.
 */
export function buildPriceSteps(
  params: AdvisorPricingParameters,
  reference: AdvisorReferenceRate,
  products: readonly AdvisorProduct[],
): MethodPriceStep[] {
  return [
    {
      key: 'referencia',
      role: 'base',
      label: 'Tipo de referencia',
      amount: formatPercent(reference.value, 2),
      detail: `${reference.label}, congelado en el export y sustituible por el del día al repreciar.`,
    },
    {
      key: 'margen',
      role: 'add',
      label: 'Margen del producto',
      amount: marginRange(products),
      detail:
        'Fijo por producto, sin relación con el score: cubre coste operativo y capital.',
    },
    {
      key: 'riesgo',
      role: 'add',
      label: 'Prima de riesgo',
      amount: `PD anual × ${formatPercent(params.stressToDefault)} × LGD`,
      detail: `Pérdida esperada, con tope de ${formatNumber(params.maxRiskPremiumBps)} pb. La PD sale de un modelo logístico sobre los cuatro pilares, la confianza y log(meses observados).`,
    },
    {
      key: 'datos',
      role: 'add',
      label: 'Prima por incertidumbre de datos',
      amount: `${formatNumber(params.maxDataUncertaintyBps)} pb × (1 − confianza)`,
      detail: `Con los 100 puntos cubiertos desaparece. Por debajo del ${formatPercent(params.minConfidenceForCredit)} de confianza no se ofrece crédito.`,
    },
    {
      key: 'tendencia',
      role: 'add',
      label: 'Ajuste por tendencia',
      amount: `${formatSigned(params.trendDeclineBps, 0)} o ${formatSigned(params.trendImproveBps, 0)} pb`,
      detail:
        'Encarece cuando la previsión a +6 meses cae 5 puntos o más, y abarata cuando sube 5 o más.',
    },
    {
      key: 'total',
      role: 'total',
      label: 'Tipo anual ofrecido',
      amount: 'referencia + diferencial',
      detail:
        'El diferencial se acota entre el mínimo y el máximo del producto antes de publicarse.',
    },
  ];
}
