import type { PulseCompanyDetails } from '@/lib/pulse/details/types';
import {
  readPulseCompanyFile,
  readPulseDetailsFile,
  readPulseSummaryFile,
} from '@/lib/pulse/source/files';
import type { PulseDataSource } from '@/lib/pulse/source/types';
import type { PulseCompany, PulseSummary } from '@/lib/pulse/types';

/**
 * Data source backed by the JSON files bundled in `src/data/pulse`.
 *
 * It is the fallback used whenever `PULSE_API_URL` is not configured, which
 * keeps the demo working with no backend running.
 */
export class StaticPulseSource implements PulseDataSource {
  readonly kind = 'static' as const;

  /** @returns Score metadata and one row per company, read from disk. */
  async getSummary(): Promise<PulseSummary> {
    return readPulseSummaryFile();
  }

  /**
   * @param companyId - Identifier such as `COMP_0001`.
   * @returns The company with history and forecast, or `null`.
   */
  async getCompany(companyId: string): Promise<PulseCompany | null> {
    return readPulseCompanyFile(companyId);
  }

  /**
   * @param companyId - Identifier such as `COMP_0001`.
   * @returns The detail of every variable, or `null`.
   */
  async getCompanyDetails(
    companyId: string,
  ): Promise<PulseCompanyDetails | null> {
    return readPulseDetailsFile(companyId);
  }
}
