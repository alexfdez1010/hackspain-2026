import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { averageMonthlyInflow } from '@/lib/xray/offer';
import { parseCompany } from '@/lib/xray/parse';
import { parseSummary } from '@/lib/xray/parse-summary';
import type { EvaluationReport } from '@/lib/xray/source/types';
import type { Company, XraySummary } from '@/lib/xray/types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'xray');
const COMPANIES_DIR = path.join(DATA_DIR, 'companies');
const COMPANY_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

let summaryCache: XraySummary | null = null;
let inflowCache: Map<string, number> | null = null;
const companyCache = new Map<string, Company | null>();

/**
 * Reads and parses a JSON file from disk.
 *
 * @param file - Absolute path of the file.
 * @returns The parsed value, or `null` when the file is missing or malformed.
 */
function readJson(file: string): unknown {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Reads `summary.json`, memoised for the lifetime of the server process.
 *
 * @returns The normalised summary; an empty one when the file is missing, so
 * pages render an explicit empty state instead of crashing.
 */
export function readSummaryFile(): XraySummary {
  if (!summaryCache) {
    summaryCache = parseSummary(readJson(path.join(DATA_DIR, 'summary.json')));
  }
  return summaryCache;
}

/**
 * Reads one company file with its 24-month series, on demand and memoised.
 *
 * @param companyId - Identifier such as `COMP_0001`.
 * @returns The company, or `null` when the identifier is unknown or unsafe.
 */
export function readCompanyFile(companyId: string): Company | null {
  if (!COMPANY_ID_PATTERN.test(companyId)) return null;
  const cached = companyCache.get(companyId);
  if (cached !== undefined) return cached;
  const company = parseCompany(
    readJson(path.join(COMPANIES_DIR, `${companyId}.json`)),
  );
  companyCache.set(companyId, company);
  return company;
}

/**
 * Lists the identifiers that have a per-company file on disk.
 *
 * @returns Sorted company identifiers.
 */
export function listCompanyIds(): string[] {
  if (!existsSync(COMPANIES_DIR)) return [];
  return readdirSync(COMPANIES_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.slice(0, -'.json'.length))
    .sort();
}

/**
 * Builds the average monthly inflow of every company, which the pricing rules
 * need but `summary.json` does not carry.
 *
 * The company folder is scanned once (~0,4 s for 1.286 files) and kept in
 * memory, so the Capital page never pays the cost twice.
 *
 * @returns A map from company identifier to average monthly inflow in euros.
 */
export function readInflowIndex(): Map<string, number> {
  if (inflowCache) return inflowCache;
  const index = new Map<string, number>();
  for (const companyId of listCompanyIds()) {
    const company = parseCompany(
      readJson(path.join(COMPANIES_DIR, `${companyId}.json`)),
    );
    if (company?.series) {
      index.set(companyId, averageMonthlyInflow(company.series));
    }
  }
  inflowCache = index;
  return index;
}

/**
 * Reads `evaluation.json` if the ML service has published it. Only top-level
 * scalars are kept, because the Método page renders a flat metric table.
 *
 * @returns The metrics and whether the file was found.
 */
export function readEvaluationFile(): EvaluationReport {
  const raw = readJson(path.join(DATA_DIR, 'evaluation.json'));
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { metrics: {}, present: false };
  }
  const metrics: Record<string, number | string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'number' || typeof value === 'string') {
      metrics[key] = value;
    }
  }
  return { metrics, present: true };
}
