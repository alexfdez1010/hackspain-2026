import {
  averageMonthlyInflow,
  computeOffer,
  offerTimeline,
  type OfferStatus,
} from '@/lib/xray/offer';
import {
  portfolioStats,
  scoreHistogram,
  toRadarRow,
  worstByScore,
} from '@/lib/xray/selectors';
import type {
  CompanyDetail,
  OfferDetail,
  OfferRow,
  PortfolioSummary,
  XrayMeta,
} from '@/lib/xray/source/types';
import { featurePillarMap } from '@/lib/xray/method';
import type { Alert, Company, XraySummary } from '@/lib/xray/types';

/**
 * Extracts the label and provenance block from a parsed summary.
 *
 * @param summary - Normalised summary payload.
 * @returns The metadata shared by every page.
 */
export function deriveMeta(summary: XraySummary): XrayMeta {
  return {
    generatedFor: summary.generated_for,
    pillarLabels: summary.pillar_labels,
    featureLabels: summary.feature_labels,
    featurePillars: featurePillarMap(summary.companies),
    companyCount: summary.companies.length,
    groupCount: new Set(summary.companies.map((company) => company.group_id))
      .size,
  };
}

/**
 * Builds the whole portfolio payload from a company list.
 *
 * @param companies - Scored companies, with or without their series.
 * @param meta - Labels and provenance to attach to the payload.
 * @returns Rows, headline stats, score distribution and worst-pillar rows.
 */
export function buildPortfolio(
  companies: readonly Company[],
  meta: XrayMeta,
): PortfolioSummary {
  const rows = companies.map(toRadarRow);
  return {
    meta,
    rows,
    stats: portfolioStats(rows),
    histogram: scoreHistogram(rows.map((row) => row.score)),
    worst: worstByScore(companies).map((company) => ({
      id: company.company_id,
      score: company.score,
      pillars: company.pillars,
    })),
  };
}

/**
 * Builds the portfolio payload from a parsed summary file.
 *
 * @param summary - Normalised summary payload.
 * @returns Rows, headline stats, score distribution and worst-pillar rows.
 */
export function derivePortfolio(summary: XraySummary): PortfolioSummary {
  return buildPortfolio(summary.companies, deriveMeta(summary));
}

/**
 * Prices a company's working-capital line from its own history.
 *
 * @param company - Company, ideally carrying its monthly series.
 * @param inflowOverride - Average monthly inflow when the series is absent.
 * @returns The marketplace row for that company.
 */
export function deriveOfferRow(
  company: Company,
  inflowOverride?: number,
): OfferRow {
  const avgMonthlyInflow =
    inflowOverride ??
    (company.series ? averageMonthlyInflow(company.series) : 0);
  return {
    id: company.company_id,
    group: company.group_id,
    score: company.score,
    pStress: company.p_stress,
    regime: company.regime,
    direction: company.direction,
    avgMonthlyInflow,
    offer: computeOffer({
      score: company.score,
      p_stress: company.p_stress,
      regime: company.regime,
      avgMonthlyInflow,
    }),
  };
}

/**
 * Prices a company's line and rebuilds its 12-month limit history.
 *
 * @param company - Company carrying its monthly series.
 * @returns The marketplace row with the limit timeline.
 */
export function deriveOfferDetail(company: Company): OfferDetail {
  return {
    ...deriveOfferRow(company),
    history: offerTimeline(company.series ?? []),
  };
}

/**
 * Assembles the company page payload.
 *
 * @param company - Company carrying its monthly series.
 * @param alerts - Alerts raised for that company, newest first.
 * @returns The company, its alerts and its priced line.
 */
export function deriveCompanyDetail(
  company: Company,
  alerts: Alert[],
): CompanyDetail {
  const row = deriveOfferRow(company);
  return {
    company,
    alerts,
    offer: row.offer,
    offerHistory: offerTimeline(company.series ?? []),
    avgMonthlyInflow: row.avgMonthlyInflow,
  };
}

/**
 * Orders the marketplace by deployable capital and applies the status filter.
 *
 * @param rows - Priced lines.
 * @param status - Status to keep, or `undefined` for all of them.
 * @param limit - Maximum number of rows to return.
 * @returns The rows to render, ordered by limit descending.
 */
export function selectOffers(
  rows: readonly OfferRow[],
  status?: OfferStatus,
  limit?: number,
): OfferRow[] {
  const filtered = status
    ? rows.filter((row) => row.offer.status === status)
    : [...rows];
  filtered.sort((a, b) => b.offer.limit - a.offer.limit);
  return limit === undefined ? filtered : filtered.slice(0, limit);
}

/**
 * Filters the alert feed by rule type and severity.
 *
 * @param alerts - All alerts.
 * @param type - Rule type to keep.
 * @param severity - Severity to keep.
 * @param limit - Maximum number of alerts to return.
 * @returns The matching alerts, newest month first.
 */
export function selectAlerts(
  alerts: readonly Alert[],
  type?: string,
  severity?: string,
  limit?: number,
): Alert[] {
  const filtered = alerts.filter(
    (alert) =>
      (type === undefined || alert.type === type) &&
      (severity === undefined || alert.severity === severity),
  );
  filtered.sort((a, b) => b.month.localeCompare(a.month));
  return limit === undefined ? filtered : filtered.slice(0, limit);
}
