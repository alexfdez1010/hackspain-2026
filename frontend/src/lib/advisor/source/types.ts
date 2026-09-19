import type { AdvisorCatalogue, AdvisorCompany } from '@/lib/advisor/types';

/**
 * Read model of the PULSE Advisor.
 *
 * `StaticAdvisorSource` is the only implementation: it reads the JSON bundled
 * in `src/data/pulse/recommendations`. Pages depend on this interface only.
 */
export interface AdvisorDataSource {
  /** Which implementation is active. */
  readonly kind: 'static';
  /** Products, pricing constants and the risk model. */
  getCatalogue(): Promise<AdvisorCatalogue>;
  /**
   * The full recommendation of one company.
   *
   * @param companyId - Identifier such as `COMP_0001`.
   */
  getCompany(companyId: string): Promise<AdvisorCompany | null>;
}
