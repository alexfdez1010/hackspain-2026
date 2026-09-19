import type { AdvisorRateKind, AdvisorReasonKind } from '@/lib/advisor/types';

/** One argument for or against a product, tied to the variable it reads. */
export interface AdvisorReason {
  code: string;
  text: string;
  kind: AdvisorReasonKind;
  /** Fit points the reason adds (negative for `contra`). */
  points: number;
  /** PULSE variable behind the reason, or `null` for a rule on the score. */
  variable: string | null;
  value: number | null;
  unit: string | null;
}

/** One line of the price, in basis points over the reference rate. */
export interface AdvisorPriceComponent {
  key: string;
  label: string;
  bps: number;
  /** One-sentence justification of the amount. */
  detail: string;
}

/** Full decomposition of the annual rate. */
export interface AdvisorPricing {
  components: AdvisorPriceComponent[];
  /** `true` when the spread hit the product band and was clamped. */
  clamped: boolean;
  referenceRate: number | null;
  /** Minimum and maximum spread of the product, in basis points. */
  spreadBand: [number, number] | null;
  /** Annualised probability of default behind the risk premium. */
  annualPd: number | null;
  expectedLossBps: number | null;
  /** Spanish sentences, one per component plus the total. */
  story: string[];
}

/** One variable of a pillar, as listed under a lever. */
export interface AdvisorLeverVariable {
  key: string;
  label: string;
  score: number | null;
  raw: number | null;
  weight: number;
}

/** Counterfactual: what happens to the risk if a pillar reached its target. */
export interface AdvisorLever {
  pillar: string;
  label: string;
  current: number | null;
  target: number | null;
  pStressNow: number | null;
  pStressThen: number | null;
  premiumSavingBps: number | null;
  variables: AdvisorLeverVariable[];
}

/** How the amount was computed. */
export interface AdvisorSizing {
  formula: string;
  inputs: Record<string, number>;
}

/** One priced recommendation. */
export interface AdvisorOffer {
  rank: number;
  product: string;
  label: string;
  family: string;
  what: string;
  /** Fit 0-100; offered from 40 upwards. */
  fit: number | null;
  amount: number | null;
  tenorMonths: number | null;
  monthlyInstalment: number | null;
  rateKind: AdvisorRateKind;
  /** Annual decimal, such as `0.0917`. */
  annualRate: number | null;
  spreadBps: number | null;
  headline: string;
  /** Spanish sentences ready to show, pros first. */
  why: string[];
  reasons: AdvisorReason[];
  sizing: AdvisorSizing;
  pricing: AdvisorPricing;
  levers: AdvisorLever[];
  leverStory: string[];
}
