import type { Offer, OfferPoint, OfferStatus } from '@/lib/xray/offer';
import {
  asRecord,
  toNumber,
  toNumberOrNull,
  toText,
} from '@/lib/xray/parse-primitives';
import { parseAlert } from '@/lib/xray/parse-summary';
import { parseCompany } from '@/lib/xray/parse';
import { deriveOfferRow } from '@/lib/xray/source/derive';
import type { OfferRow } from '@/lib/xray/source/types';
import type { Alert, Company } from '@/lib/xray/types';

const OFFER_STATUSES: readonly string[] = [
  'preaprobada',
  'en vigilancia',
  'cerrada',
];

/**
 * Unwraps a list payload, accepting both a bare array and `{ items: [...] }`.
 *
 * @param payload - Decoded response body.
 * @returns The list of items, empty when the payload carries none.
 */
export function unwrapList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ['items', 'results', 'data', 'companies']) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

/**
 * Parses a list of company records coming from the API.
 *
 * @param payload - Decoded response body.
 * @returns The companies that carry an identifier.
 */
export function mapCompanies(payload: unknown): Company[] {
  return unwrapList(payload).flatMap((item) => parseCompany(item) ?? []);
}

/**
 * Parses a list of alerts coming from the API.
 *
 * @param payload - Decoded response body.
 * @returns The alerts that carry a company and a type.
 */
export function mapAlerts(payload: unknown): Alert[] {
  return unwrapList(payload).flatMap((item) => parseAlert(item) ?? []);
}

/**
 * Parses an offer priced by the API.
 *
 * @param value - Candidate offer object.
 * @returns The offer, or `null` when the payload does not carry one, in which
 * case the caller recomputes it locally with the same rules.
 */
export function mapOffer(value: unknown): Offer | null {
  const record = asRecord(value);
  if (!record) return null;
  const limit = toNumberOrNull(record.limit);
  const spread = toNumberOrNull(record.spread_bps);
  if (limit === null || spread === null) return null;
  const status = toText(record.status, 'cerrada');
  return {
    baseMultiplier: toNumber(
      record.base_multiplier,
      toNumber(record.multiplier),
    ),
    multiplier: toNumber(record.multiplier),
    limit,
    spread_bps: spread,
    status: (OFFER_STATUSES.includes(status)
      ? status
      : 'cerrada') as OfferStatus,
  };
}

/**
 * Parses the 12-month limit history returned by `GET /api/offers/{id}`.
 *
 * @param value - Candidate history list.
 * @returns The history points that carry a month, ascending as received.
 */
export function mapOfferHistory(value: unknown): OfferPoint[] {
  return unwrapList(value).flatMap((item) => {
    const record = asRecord(item);
    if (!record) return [];
    const month = toText(record.month);
    if (month === '') return [];
    const status = toText(record.status, 'cerrada');
    return [
      {
        month,
        score: toNumber(record.score),
        limit: toNumber(record.limit),
        status: (OFFER_STATUSES.includes(status)
          ? status
          : 'cerrada') as OfferStatus,
      },
    ];
  });
}

/**
 * Maps one marketplace item, which may be a company, a company wrapped in an
 * envelope, or a company already priced by the service.
 *
 * @param item - Candidate marketplace item.
 * @returns The priced row, or `null` when the item carries no company.
 */
export function mapOfferRow(item: unknown): OfferRow | null {
  const record = asRecord(item);
  if (!record) return null;
  const company = parseCompany(record.company ?? record);
  if (!company) return null;
  const row = deriveOfferRow(company, toNumber(record.avg_monthly_inflow));
  const offer = mapOffer(record.offer ?? record);
  return offer ? { ...row, offer } : row;
}

/**
 * Extracts a flat metric table from an `evaluation` object.
 *
 * @param value - Candidate evaluation object.
 * @returns The scalar entries, and whether any were found.
 */
export function mapEvaluation(value: unknown): {
  metrics: Record<string, number | string>;
  present: boolean;
} {
  const record = asRecord(value);
  if (!record) return { metrics: {}, present: false };
  const metrics: Record<string, number | string> = {};
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === 'number' || typeof item === 'string')
      metrics[key] = item;
  }
  return { metrics, present: Object.keys(metrics).length > 0 };
}

/**
 * Builds the query string of `GET /api/companies` and friends, dropping every
 * empty or `all` value so the service receives only meaningful filters.
 *
 * @param params - Candidate query parameters.
 * @returns A query string starting with `?`, or an empty string.
 */
export function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || value === 'all') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query === '' ? '' : `?${query}`;
}
