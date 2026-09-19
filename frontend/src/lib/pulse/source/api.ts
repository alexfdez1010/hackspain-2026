import { parsePulseCompany } from '@/lib/pulse/parse-company';
import { parsePulseSummary } from '@/lib/pulse/parse-summary';
import type { PulseDataSource } from '@/lib/pulse/source/types';
import type { PulseCompany, PulseSummary } from '@/lib/pulse/types';
import { createJsonGetter, type JsonGetter } from '@/lib/api-client';

/**
 * Data source backed by the PULSE endpoints of the FastAPI service.
 *
 * The service serves the very same payloads the export writes to disk, so the
 * bundled parsers are reused: a backend that is down or answering nonsense
 * degrades to an empty portfolio, never to an exception.
 */
export class ApiPulseSource implements PulseDataSource {
  readonly kind = 'api' as const;

  private readonly get: JsonGetter;

  /**
   * @param baseUrl - Root URL of the service, such as `http://localhost:8000`.
   * @param fetchImpl - Injected `fetch`, overridden in tests.
   */
  constructor(baseUrl: string, fetchImpl?: typeof fetch) {
    this.get = createJsonGetter(baseUrl, fetchImpl);
  }

  /** @returns Score metadata and one row per company. */
  async getSummary(): Promise<PulseSummary> {
    return parsePulseSummary(await this.get('/api/pulse/summary'));
  }

  /**
   * @param companyId - Identifier such as `COMP_0001`.
   * @returns The company with history and forecast, or `null` when the service
   * answers 404.
   */
  async getCompany(companyId: string): Promise<PulseCompany | null> {
    return parsePulseCompany(
      await this.get(`/api/pulse/companies/${encodeURIComponent(companyId)}`),
    );
  }
}
