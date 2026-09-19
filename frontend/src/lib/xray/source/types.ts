import type { Offer, OfferPoint, OfferStatus } from '@/lib/xray/offer';
import type {
  HistogramBin,
  PortfolioStats,
  RadarRow,
} from '@/lib/xray/selectors';
import type { Movers } from '@/lib/xray/selectors';
import type {
  Alert,
  Anticipation,
  Company,
  Direction,
  Pillars,
  Regime,
} from '@/lib/xray/types';

/** Labels and provenance shared by every page. */
export interface XrayMeta {
  generatedFor: string;
  pillarLabels: Record<string, string>;
  featureLabels: Record<string, string>;
  /** Pillar each feature feeds, recovered from the model reasons. */
  featurePillars: Record<string, string>;
  companyCount: number;
  /** Number of distinct company groups, the unit of the cross-validation. */
  groupCount: number;
}

/** One row of the worst-companies pillar heatmap. */
export interface PillarHeatRow {
  id: string;
  score: number;
  pillars: Pillars;
}

/** Everything the portfolio radar renders in one payload. */
export interface PortfolioSummary {
  meta: XrayMeta;
  rows: RadarRow[];
  stats: PortfolioStats;
  histogram: HistogramBin[];
  worst: PillarHeatRow[];
}

/** A company with its series plus everything derived from it. */
export interface CompanyDetail {
  company: Company;
  alerts: Alert[];
  offer: Offer;
  offerHistory: OfferPoint[];
  avgMonthlyInflow: number;
}

/** A priced line in the Capital marketplace. */
export interface OfferRow {
  id: string;
  group: string;
  score: number;
  pStress: number;
  regime: Regime;
  direction: Direction;
  avgMonthlyInflow: number;
  offer: Offer;
}

/** A priced line together with its 12-month limit history. */
export interface OfferDetail extends OfferRow {
  history: OfferPoint[];
}

/** Filters accepted by the alert feed. */
export interface AlertQuery {
  type?: string;
  severity?: string;
  limit?: number;
}

/** Filters accepted by the offer marketplace. */
export interface OfferQuery {
  status?: OfferStatus;
  limit?: number;
}

/** Options accepted by the movers ranking. */
export interface MoversQuery {
  window?: number;
  limit?: number;
}

/** Evaluation numbers published by the ML service. */
export interface EvaluationReport {
  metrics: Record<string, number | string>;
  /** `false` when no evaluation payload is available. */
  present: boolean;
}

/**
 * Read model of the X-Ray dataset.
 *
 * Two implementations exist: `StaticJsonSource`, which reads the bundled JSON
 * files, and `ApiSource`, which calls the FastAPI service. Pages depend on this
 * interface only, so switching backends is an environment change.
 */
export interface XrayDataSource {
  /** Which implementation is active, surfaced in the UI footer. */
  readonly kind: 'static' | 'api';
  /** Labels and provenance. */
  getMeta(): Promise<XrayMeta>;
  /** Portfolio rows plus the distribution, stats and worst-pillar heatmap. */
  getSummary(): Promise<PortfolioSummary>;
  /** One company with series, alerts and its priced line. */
  getCompany(companyId: string): Promise<CompanyDetail | null>;
  /** Largest improvements and deteriorations over a score window. */
  getMovers(query?: MoversQuery): Promise<Movers>;
  /** Alert feed, optionally filtered. */
  getAlerts(query?: AlertQuery): Promise<Alert[]>;
  /** Number of alerts per rule type. */
  getAlertCounts(): Promise<Record<string, number>>;
  /** Lead-time evidence of the score before a stress event. */
  getAnticipation(): Promise<Anticipation>;
  /** Priced lines for the Capital marketplace. */
  getOffers(query?: OfferQuery): Promise<OfferRow[]>;
  /** One priced line with its 12-month limit history. */
  getOffer(companyId: string): Promise<OfferDetail | null>;
  /** Model evaluation numbers, when published. */
  getEvaluation(): Promise<EvaluationReport>;
  /** Whether the backing store answers. */
  health(): Promise<boolean>;
}
