import type { AdvisorCatalogue, AdvisorCompany } from '@/lib/advisor/types';

/**
 * Read model of the PULSE Advisor.
 *
 * Two implementations exist: `StaticAdvisorSource`, which reads the JSON
 * bundled in `src/data/pulse/recommendations`, and `ApiAdvisorSource`, which
 * calls the FastAPI service. Pages depend on this interface only.
 */
export interface AdvisorDataSource {
  /** Which implementation is active. */
  readonly kind: 'static' | 'api';
  /** Products, pricing constants and the risk model. */
  getCatalogue(): Promise<AdvisorCatalogue>;
  /**
   * The full recommendation of one company.
   *
   * @param companyId - Identifier such as `COMP_0001`.
   */
  getCompany(companyId: string): Promise<AdvisorCompany | null>;
}
