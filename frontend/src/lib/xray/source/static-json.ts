import { topMovers, toRadarRow } from '@/lib/xray/selectors';
import {
  deriveCompanyDetail,
  deriveMeta,
  deriveOfferDetail,
  deriveOfferRow,
  derivePortfolio,
  selectAlerts,
  selectOffers,
} from '@/lib/xray/source/derive';
import {
  readCompanyFile,
  readEvaluationFile,
  readInflowIndex,
  readSummaryFile,
} from '@/lib/xray/source/files';
import type {
  AlertQuery,
  CompanyDetail,
  EvaluationReport,
  MoversQuery,
  OfferDetail,
  OfferQuery,
  OfferRow,
  PortfolioSummary,
  XrayDataSource,
  XrayMeta,
} from '@/lib/xray/source/types';
import type { Alert, Anticipation } from '@/lib/xray/types';
import type { Movers } from '@/lib/xray/selectors';

/**
 * Data source backed by the JSON files bundled in `src/data/xray`.
 *
 * It is the fallback used whenever `XRAY_API_URL` is not configured, which
 * keeps the demo working with no backend running.
 */
export class StaticJsonSource implements XrayDataSource {
  readonly kind = 'static' as const;

  /** @returns Labels and provenance read from `summary.json`. */
  async getMeta(): Promise<XrayMeta> {
    return deriveMeta(readSummaryFile());
  }

  /** @returns Portfolio rows, stats, distribution and worst-pillar rows. */
  async getSummary(): Promise<PortfolioSummary> {
    return derivePortfolio(readSummaryFile());
  }

  /**
   * @param companyId - Identifier such as `COMP_0001`.
   * @returns The company with series, alerts and priced line, or `null`.
   */
  async getCompany(companyId: string): Promise<CompanyDetail | null> {
    const company = readCompanyFile(companyId);
    if (!company) return null;
    const alerts = readSummaryFile().alerts.filter(
      (alert) => alert.company_id === companyId,
    );
    alerts.sort((a, b) => b.month.localeCompare(a.month));
    return deriveCompanyDetail(company, alerts);
  }

  /**
   * @param query - Ranking size; the window is fixed to the six-month delta
   * carried by the summary file.
   * @returns Strongest improvements and sharpest deteriorations.
   */
  async getMovers(query: MoversQuery = {}): Promise<Movers> {
    const rows = readSummaryFile().companies.map(toRadarRow);
    return topMovers(rows, query.limit ?? 10);
  }

  /**
   * @param query - Rule type, severity and size.
   * @returns The matching alerts, newest month first.
   */
  async getAlerts(query: AlertQuery = {}): Promise<Alert[]> {
    return selectAlerts(
      readSummaryFile().alerts,
      query.type,
      query.severity,
      query.limit,
    );
  }

  /** @returns Number of alerts per rule type. */
  async getAlertCounts(): Promise<Record<string, number>> {
    return readSummaryFile().alert_counts;
  }

  /** @returns Lead-time evidence of the score before a stress event. */
  async getAnticipation(): Promise<Anticipation> {
    return readSummaryFile().anticipation;
  }

  /**
   * @param query - Status filter and size.
   * @returns Priced lines ordered by deployable capital.
   */
  async getOffers(query: OfferQuery = {}): Promise<OfferRow[]> {
    const inflow = readInflowIndex();
    const rows = readSummaryFile().companies.map((company) =>
      deriveOfferRow(company, inflow.get(company.company_id) ?? 0),
    );
    return selectOffers(rows, query.status, query.limit);
  }

  /**
   * @param companyId - Identifier such as `COMP_0001`.
   * @returns The priced line with its 12-month limit history, or `null`.
   */
  async getOffer(companyId: string): Promise<OfferDetail | null> {
    const company = readCompanyFile(companyId);
    return company ? deriveOfferDetail(company) : null;
  }

  /** @returns Evaluation metrics when `evaluation.json` exists. */
  async getEvaluation(): Promise<EvaluationReport> {
    return readEvaluationFile();
  }

  /** @returns `true` when at least one company was loaded from disk. */
  async health(): Promise<boolean> {
    return readSummaryFile().companies.length > 0;
  }
}
