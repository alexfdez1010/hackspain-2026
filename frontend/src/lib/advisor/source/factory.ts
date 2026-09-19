import { ApiAdvisorSource } from '@/lib/advisor/source/api';
import { StaticAdvisorSource } from '@/lib/advisor/source/static-json';
import type { AdvisorDataSource } from '@/lib/advisor/source/types';
import { apiBaseUrl } from '@/lib/pulse/source/factory';

let cached: AdvisorDataSource | null = null;

/**
 * Builds the Advisor data source implied by an environment.
 *
 * The same API URL that selects the PULSE service selects the Advisor, since
 * both are served by the same FastAPI application; without it the bundled JSON
 * files are read.
 *
 * @param env - Environment to read; defaults to `process.env`.
 * @param fetchImpl - Injected `fetch`, overridden in tests.
 * @returns A fresh data source.
 */
export function createAdvisorDataSource(
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: typeof fetch,
): AdvisorDataSource {
  const baseUrl = apiBaseUrl(env);
  if (!baseUrl) return new StaticAdvisorSource();
  return new ApiAdvisorSource(baseUrl, fetchImpl);
}

/**
 * Returns the process-wide Advisor data source, created on first use.
 *
 * @returns The active data source.
 */
export function getAdvisorDataSource(): AdvisorDataSource {
  if (!cached) cached = createAdvisorDataSource();
  return cached;
}
