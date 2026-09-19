import { companyName } from '@/lib/company/names';

/** One company as the navigation selector lists it. */
export interface CompanyOption {
  /** Identifier used in routes. */
  id: string;
  /** Famous name the identifier hashes to. */
  name: string;
}

/**
 * Builds the options of the company selector, sorted by name.
 *
 * Two identifiers can hash to the same name, so the identifier is kept as a
 * tiebreak and shown next to the name by the selector.
 *
 * @param companyIds - Every identifier of the export.
 * @returns The options, alphabetically by name and then by identifier.
 */
export function buildCompanyOptions(
  companyIds: readonly string[],
): CompanyOption[] {
  return companyIds
    .map((id) => ({ id, name: companyName(id) }))
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name, 'es') || a.id.localeCompare(b.id, 'es'),
    );
}
