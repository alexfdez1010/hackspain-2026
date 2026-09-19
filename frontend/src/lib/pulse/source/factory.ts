import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import type { PulseDataSource } from '@/lib/pulse/source/types';

let cached: PulseDataSource | null = null;

/**
 * Builds a PULSE data source.
 *
 * There is only one implementation: the JSON export bundled in
 * `src/data/pulse`, so the app never depends on a running backend.
 *
 * @returns A fresh data source.
 */
export function createPulseDataSource(): PulseDataSource {
  return new StaticPulseSource();
}

/**
 * Returns the process-wide PULSE data source, created on first use.
 *
 * @returns The active data source.
 */
export function getPulseDataSource(): PulseDataSource {
  if (!cached) cached = createPulseDataSource();
  return cached;
}
