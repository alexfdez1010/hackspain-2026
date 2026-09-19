import type { PulseCompanyDetails } from '@/lib/pulse/details/types';
import type { PulseCompany, PulseSummary } from '@/lib/pulse/types';

/**
 * Read model of the PULSE dataset.
 *
 * `StaticPulseSource` is the only implementation: it reads the JSON bundled in
 * `src/data/pulse`. Pages depend on this interface only, so a different store
 * stays a one-file change.
 */
export interface PulseDataSource {
  /** Which implementation is active. */
  readonly kind: 'static';
  /** Score metadata plus one row per company. */
  getSummary(): Promise<PulseSummary>;
  /**
   * One company with its monthly history and its six forecast horizons.
   *
   * @param companyId - Identifier such as `COMP_0001`.
   */
  getCompany(companyId: string): Promise<PulseCompany | null>;
  /**
   * The detail behind every variable of one company for its last month:
   * counterparties, credit lines, debt products, aging and daily cash.
   *
   * @param companyId - Identifier such as `COMP_0001`.
   */
  getCompanyDetails(companyId: string): Promise<PulseCompanyDetails | null>;
}
