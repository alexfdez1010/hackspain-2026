import { StaticAdvisorSource } from '@/lib/advisor/source/static-json';
import type { AdvisorDataSource } from '@/lib/advisor/source/types';

let cached: AdvisorDataSource | null = null;

/**
 * Builds an Advisor data source.
 *
 * There is only one implementation: the JSON export bundled in
 * `src/data/pulse/recommendations`, read straight from disk.
 *
 * @returns A fresh data source.
 */
export function createAdvisorDataSource(): AdvisorDataSource {
  return new StaticAdvisorSource();
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
