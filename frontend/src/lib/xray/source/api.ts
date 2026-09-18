import { topMovers, toRadarRow } from '@/lib/xray/selectors';
import type { Movers } from '@/lib/xray/selectors';
import {
  asRecord,
  toNumber,
  toNumberMap,
  toStringMap,
  toText,
} from '@/lib/xray/parse-primitives';
import { parseAnticipation } from '@/lib/xray/parse-summary';
import { parseCompany } from '@/lib/xray/parse';
import {
  buildPortfolio,
  deriveCompanyDetail,
  deriveOfferDetail,
} from '@/lib/xray/source/derive';
import {
  buildQuery,
  mapAlerts,
  mapCompanies,
  mapEvaluation,
  mapOffer,
  mapOfferRow,
  mapOfferHistory,
  unwrapList,
} from '@/lib/xray/source/api-mappers';
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
import {
  createJsonGetter,
  type JsonGetter,
} from '@/lib/xray/source/api-client';
import type { Alert, Anticipation } from '@/lib/xray/types';

/** Portfolio page size requested from the service. */
const PORTFOLIO_LIMIT = 5000;

/**
 * Data source backed by the FastAPI X-Ray service.
 *
 * Every response is parsed with the same tolerant parsers used for the JSON
 * files, and anything the service does not compute (an offer, a limit history)
 * is derived locally with the same pure rules, so the two sources agree.
 */
export class ApiSource implements XrayDataSource {
  readonly kind = 'api' as const;

  private readonly get: JsonGetter;

  /**
   * @param baseUrl - Root URL of the service, e.g. `http://localhost:8000`.
   * @param fetchImpl - Injected `fetch`, overridden in tests.
   */
  constructor(baseUrl: string, fetchImpl: typeof fetch = fetch) {
    this.get = createJsonGetter(baseUrl, fetchImpl);
  }

  /** @returns Labels and provenance from `GET /api/meta`. */
  async getMeta(): Promise<XrayMeta> {
    const record = asRecord(await this.get('/api/meta')) ?? {};
    return {
      generatedFor: toText(record.generated_for, 'Embat X-Ray'),
      pillarLabels: toStringMap(record.pillar_labels),
      featureLabels: toStringMap(record.feature_labels),
      featurePillars: toStringMap(record.feature_pillars),
      companyCount: toNumber(record.n_companies ?? record.company_count),
      groupCount: toNumber(record.n_groups ?? record.group_count),
    };
  }

  /** @returns Portfolio rows, stats and distribution from `GET /api/companies`. */
  async getSummary(): Promise<PortfolioSummary> {
    const [meta, payload] = await Promise.all([
      this.getMeta(),
      this.get(`/api/companies${buildQuery({ limit: PORTFOLIO_LIMIT })}`),
    ]);
    const companies = mapCompanies(payload);
    return buildPortfolio(companies, {
      ...meta,
      companyCount: meta.companyCount || companies.length,
    });
  }

  /**
   * @param companyId - Identifier such as `COMP_0001`.
   * @returns The company with series, alerts and priced line, or `null`.
   */
  async getCompany(companyId: string): Promise<CompanyDetail | null> {
    const payload = asRecord(
      await this.get(`/api/companies/${encodeURIComponent(companyId)}`),
    );
    if (!payload) return null;
    const company = parseCompany(payload.company ?? payload);
    if (!company) return null;
    const detail = deriveCompanyDetail(company, mapAlerts(payload.alerts));
    const offer = mapOffer(payload.offer);
    return offer ? { ...detail, offer } : detail;
  }

  /**
   * @param query - Trend window in months and ranking size.
   * @returns Strongest improvements and sharpest deteriorations.
   */
  async getMovers(query: MoversQuery = {}): Promise<Movers> {
    const limit = query.limit ?? 10;
    const payload = asRecord(
      await this.get(
        `/api/movers${buildQuery({ window: query.window ?? 6, limit })}`,
      ),
    );
    if (!payload) return { improvers: [], decliners: [] };
    const read = (key: string) =>
      unwrapList(payload[key])
        .flatMap((item) => parseCompany(item) ?? [])
        .map(toRadarRow);
    const movers = {
      improvers: read('improvers'),
      decliners: read('decliners'),
    };
    if (movers.improvers.length > 0 || movers.decliners.length > 0)
      return movers;
    return topMovers(mapCompanies(payload).map(toRadarRow), limit);
  }

  /**
   * @param query - Rule type, severity and size.
   * @returns The matching alerts.
   */
  async getAlerts(query: AlertQuery = {}): Promise<Alert[]> {
    return mapAlerts(await this.get(`/api/alerts${buildQuery({ ...query })}`));
  }

  /** @returns Number of alerts per rule type from `GET /api/alerts/counts`. */
  async getAlertCounts(): Promise<Record<string, number>> {
    const payload = asRecord(await this.get('/api/alerts/counts')) ?? {};
    const nested = asRecord(payload.counts);
    return toNumberMap(nested ?? payload);
  }

  /** @returns Lead-time evidence, read from `GET /api/meta`. */
  async getAnticipation(): Promise<Anticipation> {
    const record = asRecord(await this.get('/api/meta')) ?? {};
    return parseAnticipation(record.anticipation);
  }

  /**
   * @param query - Status filter and size.
   * @returns Priced lines, using the service price when it provides one.
   */
  async getOffers(query: OfferQuery = {}): Promise<OfferRow[]> {
    const payload = await this.get(`/api/offers${buildQuery({ ...query })}`);
    return unwrapList(payload).flatMap((item) => mapOfferRow(item) ?? []);
  }

  /**
   * @param companyId - Identifier such as `COMP_0001`.
   * @returns The priced line with its 12-month limit history, or `null`.
   */
  async getOffer(companyId: string): Promise<OfferDetail | null> {
    const payload = asRecord(
      await this.get(`/api/offers/${encodeURIComponent(companyId)}`),
    );
    if (!payload) return null;
    const company = parseCompany(payload.company ?? payload);
    if (!company) return null;
    const detail = deriveOfferDetail(company);
    const offer = mapOffer(payload.offer ?? payload);
    const history = mapOfferHistory(payload.history ?? payload.limit_history);
    return {
      ...detail,
      ...(offer ? { offer } : {}),
      ...(history.length > 0 ? { history } : {}),
    };
  }

  /** @returns Evaluation metrics advertised by `GET /api/meta`. */
  async getEvaluation(): Promise<EvaluationReport> {
    const record = asRecord(await this.get('/api/meta')) ?? {};
    return mapEvaluation(record.evaluation);
  }

  /** @returns `true` when `GET /health` answers with a success status. */
  async health(): Promise<boolean> {
    return (await this.get('/health')) !== null;
  }
}
