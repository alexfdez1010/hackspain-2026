import type { AdvisorLever, AdvisorOffer } from '@/lib/advisor/offer-types';
import type { PulseForecastBand, PulsePillars } from '@/lib/pulse/types';

export type {
  AdvisorLever,
  AdvisorLeverVariable,
  AdvisorOffer,
  AdvisorPriceComponent,
  AdvisorPricing,
  AdvisorReason,
  AdvisorSizing,
} from '@/lib/advisor/offer-types';

/** Whether the annual rate is what the company pays or what it earns. */
export type AdvisorRateKind = 'cost' | 'yield';

/** How a reason weighs on the fit of a product. */
export type AdvisorReasonKind = 'pro' | 'contra' | 'bloqueo';

/** Why a product was left out: a blocker, or a fit below the offer threshold. */
export type AdvisorDeclineStatus = 'no_elegible' | 'poco_encaje';

/** Risk-free rate every cost product is priced over. */
export interface AdvisorReferenceRate {
  label: string;
  /** Annual decimal, such as `0.021`. */
  value: number | null;
  /** `default` for the static export, `request` when re-priced by the API. */
  source: string;
}

/** One product of the catalogue with its pricing band. */
export interface AdvisorProduct {
  key: string;
  label: string;
  /** Product family: `circulante`, `cobros`, `pagos`, `plazo` or `tesoreria`. */
  family: string;
  /** One-sentence description of the product for the company. */
  what: string;
  rateKind: AdvisorRateKind;
  baseSpreadBps: number;
  /** Loss given default used by the risk premium, between 0 and 1. */
  lgd: number;
  minSpreadBps: number;
  maxSpreadBps: number;
  tenorMonths: number;
}

/** Constants of the pricing formula, published so the price can be audited. */
export interface AdvisorPricingParameters {
  maxRiskPremiumBps: number;
  maxDataUncertaintyBps: number;
  /** Share of stress episodes that end in default. */
  stressToDefault: number;
  trendDeclineBps: number;
  trendImproveBps: number;
  minConfidenceForCredit: number;
}

/** Evaluation of the logistic stress model behind the risk premium. */
export interface AdvisorRiskModel {
  rows: number | null;
  stressRate: number | null;
  /** Out-of-fold AUROC of the stress model. */
  auroc: number | null;
  /** Standardised coefficients per feature; negative lowers the risk. */
  coefficientsStd: Record<string, number>;
}

/** Products, pricing constants and risk model shared by every company. */
export interface AdvisorCatalogue {
  generatedFor: string;
  referenceRate: AdvisorReferenceRate;
  pricingParameters: AdvisorPricingParameters;
  products: AdvisorProduct[];
  riskModel: AdvisorRiskModel;
}

/** A product that was not offered and why. */
export interface AdvisorDeclined {
  product: string;
  label: string;
  status: AdvisorDeclineStatus;
  fit: number | null;
  reasons: string[];
}

/** What the company could unlock by moving its pillars. */
export interface AdvisorImprovementPlan {
  unlocks: string[];
  levers: AdvisorLever[];
  story: string[];
}

/** One feature of the stress model with its contribution to the logit. */
export interface AdvisorRiskContribution {
  feature: string;
  label: string;
  value: number | null;
  logit: number | null;
}

/** Probability of a stress episode in the next six months and its drivers. */
export interface AdvisorRisk {
  pStress6m: number | null;
  /** Portfolio-wide stress rate the model was trained on. */
  baseRate: number | null;
  contributions: AdvisorRiskContribution[];
}

/** Current facilities of the company. */
export interface AdvisorHoldings {
  types: string[];
  lineLimit: number | null;
  lineDrawn: number | null;
  loanOutstanding: number | null;
  nLoans: number | null;
  currentRate: number | null;
}

/** Open invoices read from the ERP. */
export interface AdvisorInvoices {
  hasErp: boolean;
  openAr: number | null;
  eligibleAr: number | null;
  arMonthly: number | null;
  openAp: number | null;
  apMonthly: number | null;
}

/** Figures every rule read, so the page can quote them. */
export interface AdvisorInputs {
  cashEnd: number | null;
  monthlyOutflow: number | null;
  monthlyCollections: number | null;
  service3m: number | null;
  /** Change of PULSE over the last three months. */
  pulseD3: number | null;
  holdings: AdvisorHoldings;
  invoices: AdvisorInvoices;
  /** Six-month forecast the trend adjustment reads. */
  outlook: PulseForecastBand | null;
}

/** Full explainable recommendation of one company. */
export interface AdvisorCompany {
  companyId: string;
  month: string;
  pulse: number | null;
  confidence: number | null;
  pillars: PulsePillars;
  referenceRate: AdvisorReferenceRate;
  /** One-sentence Spanish summary of the outcome. */
  summary: string;
  risk: AdvisorRisk;
  recommendations: AdvisorOffer[];
  declined: AdvisorDeclined[];
  improvementPlan: AdvisorImprovementPlan;
  inputs: AdvisorInputs;
  disclaimer: string;
}
