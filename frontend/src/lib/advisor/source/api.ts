import { createJsonGetter, type JsonGetter } from '@/lib/api-client';
import { parseAdvisorCatalogue } from '@/lib/advisor/parse-catalogue';
import { parseAdvisorCompany } from '@/lib/advisor/parse-company';
import type { AdvisorDataSource } from '@/lib/advisor/source/types';
import type { AdvisorCatalogue, AdvisorCompany } from '@/lib/advisor/types';

/**
 * Data source backed by the Advisor endpoints of the FastAPI service.
 *
 * The service serves the very same payloads the export writes to disk, so the
 * bundled parsers are reused: a backend that is down degrades to an empty
 * catalogue and a missing company, never to an exception.
 */
export class ApiAdvisorSource implements AdvisorDataSource {
  readonly kind = 'api' as const;

  private readonly get: JsonGetter;

  /**
   * @param baseUrl - Root URL of the service, such as `http://localhost:8000`.
   * @param fetchImpl - Injected `fetch`, overridden in tests.
   */
  constructor(baseUrl: string, fetchImpl?: typeof fetch) {
    this.get = createJsonGetter(baseUrl, fetchImpl);
  }

  /** @returns Products, pricing constants and the risk model. */
  async getCatalogue(): Promise<AdvisorCatalogue> {
    return parseAdvisorCatalogue(
      await this.get('/api/pulse/recommendations/catalogue'),
    );
  }

  /**
   * @param companyId - Identifier such as `COMP_0001`.
   * @returns The recommendation, or `null` when the service answers 404.
   */
  async getCompany(companyId: string): Promise<AdvisorCompany | null> {
    return parseAdvisorCompany(
      await this.get(
        `/api/pulse/recommendations/${encodeURIComponent(companyId)}`,
      ),
    );
  }
}
