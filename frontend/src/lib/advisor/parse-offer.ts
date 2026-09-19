import {
  asRecord,
  toArray,
  toNumber,
  toNumberMap,
  toNumberOrNull,
  toStringList,
  toText,
  toTextOrNull,
} from '@/lib/parse-primitives';
import { toRateKind } from '@/lib/advisor/parse-catalogue';
import type {
  AdvisorLever,
  AdvisorLeverVariable,
  AdvisorOffer,
  AdvisorPriceComponent,
  AdvisorPricing,
  AdvisorReason,
  AdvisorReasonKind,
} from '@/lib/advisor/types';

const REASON_KINDS: readonly AdvisorReasonKind[] = ['pro', 'contra', 'bloqueo'];

/**
 * Reads one reason of a product assessment.
 *
 * @param value - Candidate entry of `reasons`.
 * @returns The reason, or `null` when it carries no text.
 */
function parseReason(value: unknown): AdvisorReason | null {
  const record = asRecord(value);
  const text = toText(record?.text);
  if (!record || !text) return null;
  const kind = record.kind;
  return {
    code: toText(record.code),
    text,
    kind: REASON_KINDS.includes(kind as AdvisorReasonKind)
      ? (kind as AdvisorReasonKind)
      : 'pro',
    points: toNumber(record.points),
    variable: toTextOrNull(record.variable),
    value: toNumberOrNull(record.value),
    unit: toTextOrNull(record.unit),
  };
}

/**
 * Reads one line of the price.
 *
 * @param value - Candidate entry of `pricing.components`.
 * @returns The component, or `null` when it carries no key.
 */
function parsePriceComponent(value: unknown): AdvisorPriceComponent | null {
  const record = asRecord(value);
  const key = toText(record?.key);
  if (!record || !key) return null;
  return {
    key,
    label: toText(record.label, key),
    bps: toNumber(record.bps),
    detail: toText(record.detail),
  };
}

/**
 * Reads the price decomposition of an offer.
 *
 * @param value - Candidate `pricing` object.
 * @returns The pricing block; empty lists when absent.
 */
export function parsePricing(value: unknown): AdvisorPricing {
  const record = asRecord(value) ?? {};
  const band = toArray(record.spread_band_bps).map((item) => toNumber(item));
  return {
    components: toArray(record.components)
      .map(parsePriceComponent)
      .filter((item): item is AdvisorPriceComponent => item !== null),
    clamped: record.clamped === true,
    referenceRate: toNumberOrNull(record.reference_rate),
    spreadBand: band.length === 2 ? [band[0], band[1]] : null,
    annualPd: toNumberOrNull(record.annual_pd),
    expectedLossBps: toNumberOrNull(record.expected_loss_bps),
    story: toStringList(record.story),
  };
}

/**
 * Reads one variable listed under a lever.
 *
 * @param value - Candidate entry of `levers[].variables`.
 * @returns The variable, or `null` when it carries no key.
 */
function parseLeverVariable(value: unknown): AdvisorLeverVariable | null {
  const record = asRecord(value);
  const key = toText(record?.key);
  if (!record || !key) return null;
  return {
    key,
    label: toText(record.label, key),
    score: toNumberOrNull(record.score),
    raw: toNumberOrNull(record.raw),
    weight: toNumber(record.weight),
  };
}

/**
 * Reads one counterfactual lever.
 *
 * @param value - Candidate entry of `levers`.
 * @returns The lever, or `null` when it names no pillar.
 */
export function parseLever(value: unknown): AdvisorLever | null {
  const record = asRecord(value);
  const pillar = toText(record?.pillar);
  if (!record || !pillar) return null;
  return {
    pillar,
    label: toText(record.label, pillar),
    current: toNumberOrNull(record.current),
    target: toNumberOrNull(record.target),
    pStressNow: toNumberOrNull(record.p_stress_now),
    pStressThen: toNumberOrNull(record.p_stress_then),
    premiumSavingBps: toNumberOrNull(record.premium_saving_bps),
    variables: toArray(record.variables)
      .map(parseLeverVariable)
      .filter((item): item is AdvisorLeverVariable => item !== null),
  };
}

/**
 * Reads a list of levers, dropping malformed entries.
 *
 * @param value - Candidate `levers` list.
 * @returns The levers in the published order.
 */
export function parseLevers(value: unknown): AdvisorLever[] {
  return toArray(value)
    .map(parseLever)
    .filter((item): item is AdvisorLever => item !== null);
}

/**
 * Reads one priced recommendation.
 *
 * @param value - Candidate entry of `recommendations`.
 * @returns The offer, or `null` when it names no product.
 */
export function parseOffer(value: unknown): AdvisorOffer | null {
  const record = asRecord(value);
  const product = toText(record?.product);
  if (!record || !product) return null;
  const sizing = asRecord(record.sizing) ?? {};
  return {
    rank: toNumber(record.rank),
    product,
    label: toText(record.label, product),
    family: toText(record.family),
    what: toText(record.what),
    fit: toNumberOrNull(record.fit),
    amount: toNumberOrNull(record.amount),
    tenorMonths: toNumberOrNull(record.tenor_months),
    monthlyInstalment: toNumberOrNull(record.monthly_instalment),
    rateKind: toRateKind(record.rate_kind),
    annualRate: toNumberOrNull(record.annual_rate),
    spreadBps: toNumberOrNull(record.spread_bps),
    headline: toText(record.headline),
    why: toStringList(record.why),
    reasons: toArray(record.reasons)
      .map(parseReason)
      .filter((item): item is AdvisorReason => item !== null),
    sizing: {
      formula: toText(sizing.formula),
      inputs: toNumberMap(sizing.inputs),
    },
    pricing: parsePricing(record.pricing),
    levers: parseLevers(record.levers),
    leverStory: toStringList(record.lever_story),
  };
}
