import { ApiSource } from '@/lib/xray/source/api';
import { StaticJsonSource } from '@/lib/xray/source/static-json';
import type { XrayDataSource } from '@/lib/xray/source/types';

let cached: XrayDataSource | null = null;

/**
 * Builds the data source implied by an environment.
 *
 * `XRAY_API_URL` selects the FastAPI service; anything else — unset, blank or
 * whitespace — falls back to the bundled JSON files, so the demo never depends
 * on a running backend.
 *
 * @param env - Environment to read; defaults to `process.env`.
 * @param fetchImpl - Injected `fetch`, overridden in tests.
 * @returns A fresh data source.
 */
export function createDataSource(
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: typeof fetch,
): XrayDataSource {
  const baseUrl = env.XRAY_API_URL?.trim();
  if (!baseUrl) return new StaticJsonSource();
  return new ApiSource(baseUrl, fetchImpl);
}

/**
 * Returns the process-wide data source, created on first use.
 *
 * @returns The active data source.
 */
export function getDataSource(): XrayDataSource {
  if (!cached) cached = createDataSource();
  return cached;
}
