import type { PulseCompany, PulseSummary } from '@/lib/pulse/types';

/**
 * Read model of the PULSE dataset.
 *
 * Two implementations exist: `StaticPulseSource`, which reads the JSON bundled
 * in `src/data/pulse`, and `ApiPulseSource`, which calls the FastAPI service.
 * Pages depend on this interface only, so switching backends is an environment
 * change and never a code change.
 */
export interface PulseDataSource {
  /** Which implementation is active. */
  readonly kind: 'static' | 'api';
  /** Score metadata plus one row per company. */
  getSummary(): Promise<PulseSummary>;
  /**
   * One company with its monthly history and its twelve forecast horizons.
   *
   * @param companyId - Identifier such as `COMP_0001`.
   */
  getCompany(companyId: string): Promise<PulseCompany | null>;
}
