import {
  asRecord,
  toArray,
  toNumber,
  toNumberMap,
  toNumberOrNull,
  toText,
} from '@/lib/parse-primitives';
import type {
  AdvisorCatalogue,
  AdvisorProduct,
  AdvisorRateKind,
  AdvisorReferenceRate,
} from '@/lib/advisor/types';

/** Catalogue used when the export is missing, so pages render empty. */
export const EMPTY_CATALOGUE: AdvisorCatalogue = {
  generatedFor: '',
  referenceRate: { label: '', value: null, source: '' },
  pricingParameters: {
    maxRiskPremiumBps: 0,
    maxDataUncertaintyBps: 0,
    stressToDefault: 0,
    trendDeclineBps: 0,
    trendImproveBps: 0,
    minConfidenceForCredit: 0,
  },
  products: [],
  riskModel: { rows: null, stressRate: null, auroc: null, coefficientsStd: {} },
};

/**
 * Normalises the rate kind, defaulting to a cost.
 *
 * @param value - Candidate value.
 * @returns `yield` only when the export says so.
 */
export function toRateKind(value: unknown): AdvisorRateKind {
  return value === 'yield' ? 'yield' : 'cost';
}

/**
 * Reads the reference rate block.
 *
 * @param value - Candidate `reference_rate` object.
 * @returns The rate, with `null` when the value is missing.
 */
export function parseReferenceRate(value: unknown): AdvisorReferenceRate {
  const record = asRecord(value);
  return {
    label: toText(record?.label),
    value: toNumberOrNull(record?.value),
    source: toText(record?.source, 'default'),
  };
}

/**
 * Normalises one product of the catalogue.
 *
 * @param value - Candidate entry of `products`.
 * @returns The product, or `null` when it carries no key.
 */
function parseProduct(value: unknown): AdvisorProduct | null {
  const record = asRecord(value);
  const key = toText(record?.key);
  if (!record || !key) return null;
  return {
    key,
    label: toText(record.label_es, key),
    family: toText(record.family),
    what: toText(record.what_es),
    rateKind: toRateKind(record.rate_kind),
    baseSpreadBps: toNumber(record.base_spread_bps),
    lgd: toNumber(record.lgd),
    minSpreadBps: toNumber(record.min_spread_bps),
    maxSpreadBps: toNumber(record.max_spread_bps),
    tenorMonths: toNumber(record.tenor_months),
  };
}

/**
 * Parses the advisor catalogue, tolerating missing or malformed payloads.
 *
 * The same shape is served by `GET /api/pulse/recommendations/catalogue` and
 * bundled as `src/data/pulse/recommendations/catalogue.json`.
 *
 * @param value - Raw payload.
 * @returns The catalogue; empty when the payload is unusable.
 */
export function parseAdvisorCatalogue(value: unknown): AdvisorCatalogue {
  const record = asRecord(value);
  if (!record) return EMPTY_CATALOGUE;
  const pricing = asRecord(record.pricing_parameters) ?? {};
  const risk = asRecord(record.risk_model) ?? {};
  return {
    generatedFor: toText(record.generated_for),
    referenceRate: parseReferenceRate(record.reference_rate),
    pricingParameters: {
      maxRiskPremiumBps: toNumber(pricing.max_risk_premium_bps),
      maxDataUncertaintyBps: toNumber(pricing.max_data_uncertainty_bps),
      stressToDefault: toNumber(pricing.stress_to_default),
      trendDeclineBps: toNumber(pricing.trend_decline_bps),
      trendImproveBps: toNumber(pricing.trend_improve_bps),
      minConfidenceForCredit: toNumber(pricing.min_confidence_for_credit),
    },
    products: toArray(record.products)
      .map(parseProduct)
      .filter((item): item is AdvisorProduct => item !== null),
    riskModel: {
      rows: toNumberOrNull(risk.rows),
      stressRate: toNumberOrNull(risk.stress_rate),
      auroc: toNumberOrNull(risk.oof_auroc),
      coefficientsStd: toNumberMap(risk.coefficients_std),
    },
  };
}
