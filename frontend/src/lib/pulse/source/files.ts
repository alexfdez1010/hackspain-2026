import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { parsePulseCompanyDetails } from '@/lib/pulse/details/parse';
import type { PulseCompanyDetails } from '@/lib/pulse/details/types';
import { parsePulseCompany } from '@/lib/pulse/parse-company';
import { parsePulseSummary } from '@/lib/pulse/parse-summary';
import type { PulseCompany, PulseSummary } from '@/lib/pulse/types';

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'pulse');
const COMPANIES_DIR = path.join(DATA_DIR, 'companies');
const DETAILS_DIR = path.join(DATA_DIR, 'details');
const COMPANY_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

let summaryCache: PulseSummary | null = null;
const companyCache = new Map<string, PulseCompany | null>();
const detailsCache = new Map<string, PulseCompanyDetails | null>();

/**
 * Reads and decodes one JSON file.
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
 * @returns The summary; an empty one when the export is missing, so pages show
 * an explicit empty state instead of failing.
 */
export function readPulseSummaryFile(): PulseSummary {
  if (!summaryCache) {
    summaryCache = parsePulseSummary(
      readJson(path.join(DATA_DIR, 'summary.json')),
    );
  }
  return summaryCache;
}

/**
 * Reads one of the 1.285 company files, on demand and memoised.
 *
 * The identifier is validated before it reaches the filesystem, so a crafted
 * route parameter cannot escape the data folder.
 *
 * @param companyId - Identifier such as `COMP_0001`.
 * @returns The company, or `null` when the identifier is unknown or unsafe.
 */
export function readPulseCompanyFile(companyId: string): PulseCompany | null {
  if (!COMPANY_ID_PATTERN.test(companyId)) return null;
  const cached = companyCache.get(companyId);
  if (cached !== undefined) return cached;
  const company = parsePulseCompany(
    readJson(path.join(COMPANIES_DIR, `${companyId}.json`)),
  );
  companyCache.set(companyId, company);
  return company;
}

/**
 * Reads the detail file of one company, on demand and memoised.
 *
 * @param companyId - Identifier such as `COMP_0001`.
 * @returns The details, or `null` when the identifier is unknown or unsafe
 * or the detail export has not been run.
 */
export function readPulseDetailsFile(
  companyId: string,
): PulseCompanyDetails | null {
  if (!COMPANY_ID_PATTERN.test(companyId)) return null;
  const cached = detailsCache.get(companyId);
  if (cached !== undefined) return cached;
  const details = parsePulseCompanyDetails(
    readJson(path.join(DETAILS_DIR, `${companyId}.json`)),
  );
  detailsCache.set(companyId, details);
  return details;
}
