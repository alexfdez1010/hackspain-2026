import {
  asRecord,
  toArray,
  toNumberOrNull,
  toStringList,
  toText,
} from '@/lib/parse-primitives';
import { parseReferenceRate } from '@/lib/advisor/parse-catalogue';
import { parseLevers, parseOffer } from '@/lib/advisor/parse-offer';
import type {
  AdvisorCompany,
  AdvisorDeclined,
  AdvisorInputs,
  AdvisorOffer,
  AdvisorRisk,
  AdvisorRiskContribution,
} from '@/lib/advisor/types';
import { toPulsePillars } from '@/lib/pulse/parse-primitives';
import { parseBand } from '@/lib/pulse/parse-summary';

/**
 * Reads one feature of the stress model.
 *
 * @param value - Candidate entry of `risk.contributions`.
 * @returns The contribution, or `null` when it names no feature.
 */
function parseRiskContribution(value: unknown): AdvisorRiskContribution | null {
  const record = asRecord(value);
  const feature = toText(record?.feature);
  if (!record || !feature) return null;
  return {
    feature,
    label: toText(record.label, feature),
    value: toNumberOrNull(record.value),
    logit: toNumberOrNull(record.logit),
  };
}

/**
 * Reads the risk block, ordered by the size of each driver.
 *
 * @param value - Candidate `risk` object.
 * @returns The probability of stress and its drivers.
 */
export function parseRisk(value: unknown): AdvisorRisk {
  const record = asRecord(value) ?? {};
  return {
    pStress6m: toNumberOrNull(record.p_stress_6m),
    baseRate: toNumberOrNull(record.base_rate),
    contributions: toArray(record.contributions)
      .map(parseRiskContribution)
      .filter((item): item is AdvisorRiskContribution => item !== null)
      .sort((a, b) => Math.abs(b.logit ?? 0) - Math.abs(a.logit ?? 0)),
  };
}

/**
 * Reads one product that was not offered.
 *
 * @param value - Candidate entry of `declined`.
 * @returns The entry, or `null` when it names no product.
 */
function parseDeclined(value: unknown): AdvisorDeclined | null {
  const record = asRecord(value);
  const product = toText(record?.product);
  if (!record || !product) return null;
  return {
    product,
    label: toText(record.label, product),
    status: record.status === 'poco_encaje' ? 'poco_encaje' : 'no_elegible',
    fit: toNumberOrNull(record.fit),
    reasons: toStringList(record.reasons),
  };
}

/**
 * Reads the figures the rules were evaluated on.
 *
 * @param value - Candidate `inputs` object.
 * @returns The inputs, with `null` for anything missing.
 */
export function parseInputs(value: unknown): AdvisorInputs {
  const record = asRecord(value) ?? {};
  const holdings = asRecord(record.holdings) ?? {};
  const invoices = asRecord(record.invoices) ?? {};
  return {
    cashEnd: toNumberOrNull(record.cash_end),
    monthlyOutflow: toNumberOrNull(record.monthly_outflow),
    monthlyCollections: toNumberOrNull(record.monthly_collections),
    service3m: toNumberOrNull(record.service_3m),
    pulseRawD3: toNumberOrNull(record.pulse_raw_d3),
    holdings: {
      types: toStringList(holdings.types),
      lineLimit: toNumberOrNull(holdings.line_limit),
      lineDrawn: toNumberOrNull(holdings.line_drawn),
      loanOutstanding: toNumberOrNull(holdings.loan_outstanding),
      nLoans: toNumberOrNull(holdings.n_loans),
      currentRate: toNumberOrNull(holdings.current_rate),
    },
    invoices: {
      hasErp: invoices.has_erp === true,
      openAr: toNumberOrNull(invoices.open_ar),
      eligibleAr: toNumberOrNull(invoices.eligible_ar),
      arMonthly: toNumberOrNull(invoices.ar_monthly),
      openAp: toNumberOrNull(invoices.open_ap),
      apMonthly: toNumberOrNull(invoices.ap_monthly),
    },
    outlook: parseBand(record.outlook),
  };
}

/**
 * Parses one company recommendation payload, tolerating missing fields.
 *
 * The same shape is served by `GET /api/pulse/recommendations/{id}` and
 * bundled as `src/data/pulse/recommendations/companies/<id>.json`.
 *
 * @param value - Raw payload.
 * @returns The recommendation, or `null` when it carries no company id.
 */
export function parseAdvisorCompany(value: unknown): AdvisorCompany | null {
  const record = asRecord(value);
  const companyId = toText(record?.company_id);
  if (!record || !companyId) return null;
  const plan = asRecord(record.improvement_plan) ?? {};
  return {
    companyId,
    month: toText(record.month),
    pulse: toNumberOrNull(record.pulse),
    confidence: toNumberOrNull(record.confidence),
    pillars: toPulsePillars(record.pillars),
    referenceRate: parseReferenceRate(record.reference_rate),
    summary: toText(record.summary),
    risk: parseRisk(record.risk),
    recommendations: toArray(record.recommendations)
      .map(parseOffer)
      .filter((item): item is AdvisorOffer => item !== null)
      .sort((a, b) => a.rank - b.rank),
    declined: toArray(record.declined)
      .map(parseDeclined)
      .filter((item): item is AdvisorDeclined => item !== null),
    improvementPlan: {
      unlocks: toStringList(plan.unlocks),
      levers: parseLevers(plan.levers),
      story: toStringList(plan.story),
    },
    inputs: parseInputs(record.inputs),
    disclaimer: toText(record.disclaimer),
  };
}
