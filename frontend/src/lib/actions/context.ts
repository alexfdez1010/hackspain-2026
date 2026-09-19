import type { AdvisorCompany, AdvisorLever } from '@/lib/advisor/types';
import { sortLevers } from '@/lib/advisor/view';
import { companyName } from '@/lib/company/names';
import { activeSignal } from '@/lib/pulse/signals';
import type { PulseCompany, PulseMeta } from '@/lib/pulse/types';
import { scoreBand } from '@/lib/score';

/** One variable of the score with its last reading. */
export interface ActionVariable {
  key: string;
  label: string;
  /** 0-100 score; `null` when the month has no data. */
  score: number | null;
  raw: number | null;
  unit: string;
  /** Points of the 100 the variable owns. */
  weight: number;
  pillar: string;
}

/** The best counterfactual of an offer, as the model reads it. */
export interface ActionLever {
  pillar: string;
  label: string;
  current: number | null;
  target: number | null;
  pStressNow: number | null;
  pStressThen: number | null;
  premiumSavingBps: number | null;
  variables: { key: string; label: string; score: number | null }[];
}

/** One priced product with its argument. */
export interface ActionOffer {
  label: string;
  headline: string;
  amount: number | null;
  tenorMonths: number | null;
  annualRate: number | null;
  monthlyInstalment: number | null;
  why: string[];
  bestLever: ActionLever | null;
}

/** Everything the model may quote: the company's own figures and nothing else. */
export interface ActionContext {
  companyId: string;
  name: string;
  month: string;
  pulse: number | null;
  band: string;
  change: number | null;
  confidence: number | null;
  pillars: Record<string, number | null>;
  /** Known variables, weakest first. */
  weakestVariables: ActionVariable[];
  /** Variables without data this month, heaviest first. */
  unknownVariables: ActionVariable[];
  forecast6m: {
    pulsePred: number | null;
    p10: number | null;
    p90: number | null;
  } | null;
  signal: {
    kind: string;
    headline: string;
    detail: string;
    pPersistent: number | null;
  } | null;
  pStress6m: number | null;
  cash: { cashEnd: number | null; monthlyOutflow: number | null };
  offers: ActionOffer[];
  declined: { label: string; reason: string }[];
  unlocks: string[];
}

/** Keeps the lever the model needs and drops the rest. */
function toLever(lever: AdvisorLever | undefined): ActionLever | null {
  if (!lever) return null;
  return {
    pillar: lever.pillar,
    label: lever.label,
    current: lever.current,
    target: lever.target,
    pStressNow: lever.pStressNow,
    pStressThen: lever.pStressThen,
    premiumSavingBps: lever.premiumSavingBps,
    variables: lever.variables.slice(0, 2).map((v) => ({
      key: v.key,
      label: v.label,
      score: v.score,
    })),
  };
}

/**
 * Reads the eleven variables of the last close with their metadata.
 *
 * @param company - Company with its observed series.
 * @param meta - Score metadata with labels and weights.
 * @returns One entry per variable of the score.
 */
function readVariables(
  company: PulseCompany,
  meta: PulseMeta,
): ActionVariable[] {
  const last = company.series[company.series.length - 1];
  return meta.variables.map((variable) => {
    const value = last?.variables[variable.key];
    return {
      key: variable.key,
      label: variable.label,
      score: value?.known ? value.score : null,
      raw: value?.known ? value.raw : null,
      unit: variable.unit,
      weight: variable.weight,
      pillar: variable.pillar,
    };
  });
}

/**
 * Builds the compact, server-owned context the actions are written from.
 *
 * Only the company's own figures cross the boundary: no portfolio, no model
 * internals beyond the probability of stress the price already shows.
 *
 * @param company - PULSE of the company.
 * @param meta - Score metadata.
 * @param advisor - Recommendations of the company, or `null` when there are none.
 * @returns The context serialised into the prompt.
 */
export function buildActionContext(
  company: PulseCompany,
  meta: PulseMeta,
  advisor: AdvisorCompany | null,
): ActionContext {
  const variables = readVariables(company, meta);
  const known = variables.filter((v) => v.score !== null);
  const unknown = variables.filter((v) => v.score === null);
  const signal = activeSignal(company);
  const last = company.forecast[company.forecast.length - 1];
  return {
    companyId: company.companyId,
    name: companyName(company.companyId),
    month: company.month,
    pulse: company.pulse,
    band: scoreBand(company.pulse).label,
    change:
      company.pulse !== null && company.pulsePrev !== null
        ? company.pulse - company.pulsePrev
        : null,
    confidence: company.confidence,
    pillars: company.pillars,
    weakestVariables: known
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
      .slice(0, 3),
    unknownVariables: unknown.sort((a, b) => b.weight - a.weight),
    forecast6m: last
      ? { pulsePred: last.pulsePred, p10: last.pulseP10, p90: last.pulseP90 }
      : null,
    signal: signal
      ? {
          kind: signal.kind,
          headline: signal.headline,
          detail: signal.detail,
          pPersistent: signal.pPersistent,
        }
      : null,
    pStress6m: advisor?.risk.pStress6m ?? null,
    cash: {
      cashEnd: advisor?.inputs.cashEnd ?? null,
      monthlyOutflow: advisor?.inputs.monthlyOutflow ?? null,
    },
    offers: (advisor?.recommendations ?? []).map((offer) => ({
      label: offer.label,
      headline: offer.headline,
      amount: offer.amount,
      tenorMonths: offer.tenorMonths,
      annualRate: offer.annualRate,
      monthlyInstalment: offer.monthlyInstalment,
      why: offer.why.slice(0, 2),
      bestLever: toLever(sortLevers(offer.levers)[0]),
    })),
    declined: (advisor?.declined ?? []).map((item) => ({
      label: item.label,
      reason: item.reasons[0] ?? '',
    })),
    unlocks: advisor?.improvementPlan.unlocks ?? [],
  };
}
