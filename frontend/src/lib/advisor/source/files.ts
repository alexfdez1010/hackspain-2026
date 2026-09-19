import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { parseAdvisorCatalogue } from '@/lib/advisor/parse-catalogue';
import { parseAdvisorCompany } from '@/lib/advisor/parse-company';
import type { AdvisorCatalogue, AdvisorCompany } from '@/lib/advisor/types';
import { COMPANY_ID_PATTERN } from '@/lib/routes';

const DATA_DIR = path.join(
  process.cwd(),
  'src',
  'data',
  'pulse',
  'recommendations',
);
const COMPANIES_DIR = path.join(DATA_DIR, 'companies');

let catalogueCache: AdvisorCatalogue | null = null;
const companyCache = new Map<string, AdvisorCompany | null>();

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
 * Reads `catalogue.json`, memoised for the lifetime of the server process.
 *
 * @returns The catalogue; an empty one when the export is missing.
 */
export function readAdvisorCatalogueFile(): AdvisorCatalogue {
  if (!catalogueCache) {
    catalogueCache = parseAdvisorCatalogue(
      readJson(path.join(DATA_DIR, 'catalogue.json')),
    );
  }
  return catalogueCache;
}

/**
 * Reads one company recommendation file, on demand and memoised.
 *
 * The identifier is validated before it reaches the filesystem, so a crafted
 * route parameter cannot escape the data folder.
 *
 * @param companyId - Identifier such as `COMP_0001`.
 * @returns The recommendation, or `null` when the identifier is unknown or unsafe.
 */
export function readAdvisorCompanyFile(
  companyId: string,
): AdvisorCompany | null {
  if (!COMPANY_ID_PATTERN.test(companyId)) return null;
  const cached = companyCache.get(companyId);
  if (cached !== undefined) return cached;
  const company = parseAdvisorCompany(
    readJson(path.join(COMPANIES_DIR, `${companyId}.json`)),
  );
  companyCache.set(companyId, company);
  return company;
}
