import {
  readAdvisorCatalogueFile,
  readAdvisorCompanyFile,
} from '@/lib/advisor/source/files';
import type { AdvisorDataSource } from '@/lib/advisor/source/types';
import type { AdvisorCatalogue, AdvisorCompany } from '@/lib/advisor/types';

/**
 * Data source backed by the JSON files bundled in
 * `src/data/pulse/recommendations`, the fallback when no API URL is set.
 */
export class StaticAdvisorSource implements AdvisorDataSource {
  readonly kind = 'static' as const;

  /** @returns The catalogue read from disk. */
  async getCatalogue(): Promise<AdvisorCatalogue> {
    return readAdvisorCatalogueFile();
  }

  /**
   * @param companyId - Identifier such as `COMP_0001`.
   * @returns The recommendation, or `null`.
   */
  async getCompany(companyId: string): Promise<AdvisorCompany | null> {
    return readAdvisorCompanyFile(companyId);
  }
}
