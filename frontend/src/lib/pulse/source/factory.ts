import { ApiPulseSource } from '@/lib/pulse/source/api';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import type { PulseDataSource } from '@/lib/pulse/source/types';

let cached: PulseDataSource | null = null;

/**
 * Builds the PULSE data source implied by an environment.
 *
 * `XRAY_API_URL` selects the FastAPI service, which serves PULSE under
 * `/api/pulse`; anything else — unset, blank or whitespace — falls back to the
 * bundled JSON files, so the demo never depends on a running backend.
 *
 * @param env - Environment to read; defaults to `process.env`.
 * @param fetchImpl - Injected `fetch`, overridden in tests.
 * @returns A fresh data source.
 */
export function createPulseDataSource(
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: typeof fetch,
): PulseDataSource {
  const baseUrl = env.XRAY_API_URL?.trim();
  if (!baseUrl) return new StaticPulseSource();
  return new ApiPulseSource(baseUrl, fetchImpl);
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
