import { getAdvisorDataSource } from '@/lib/advisor/data';
import type { AdvisorCompany } from '@/lib/advisor/types';
import { companyName } from '@/lib/company/names';
import { getPulseDataSource } from '@/lib/pulse/data';
import type { PulseCompanyDetails } from '@/lib/pulse/details/types';
import type { PulseCompany, PulseMeta } from '@/lib/pulse/types';

/** Everything the three company pages read, loaded once per request. */
export interface CompanyPageData {
  company: PulseCompany;
  meta: PulseMeta;
  /** Recommendations of the company, or `null` when the advisor has none. */
  advisor: AdvisorCompany | null;
  /** Detail behind the variables, or `null` when not asked for or not published. */
  details: PulseCompanyDetails | null;
}

/**
 * Loads a company with the score metadata and its recommendations.
 *
 * The summary, diagnosis and detail pages share one company and one set of
 * metadata, so they share this loader instead of each one calling the data
 * sources in its own way.
 *
 * @param id - Company identifier from the route.
 * @param withAdvisor - Whether the page needs the advisor figures.
 * @param withDetails - Whether the page needs the detail of the variables.
 * @returns The page data, or `null` when the company is unknown.
 */
export async function loadCompanyPage(
  id: string,
  withAdvisor = false,
  withDetails = false,
): Promise<CompanyPageData | null> {
  const source = getPulseDataSource();
  const [company, summary, advisor, details] = await Promise.all([
    source.getCompany(id),
    source.getSummary(),
    withAdvisor ? getAdvisorDataSource().getCompany(id) : null,
    withDetails ? source.getCompanyDetails(id) : null,
  ]);
  if (!company) return null;
  return { company, meta: summary.meta, advisor, details };
}

/**
 * Titles the browser tab of a company page.
 *
 * @param id - Company identifier.
 * @param section - Spanish name of the section, such as `Diagnóstico`.
 * @returns The tab title.
 */
export function companyPageTitle(id: string, section: string): string {
  return `${companyName(id)} — ${section} · Embat Pulse`;
}
