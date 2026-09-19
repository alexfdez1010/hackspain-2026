import { companyName } from '@/lib/company/names';

/** Names the search shows per page; «cargar más» adds another page. */
export const VISIBLE_LIMIT = 40;

/** A page of search results with the size of the whole match. */
export interface CompanyMatches {
  /** Visible options, the company in context first when it had to be added. */
  items: CompanyOption[];
  /** How many options match the query in total. */
  total: number;
}

/** One company as the navigation search lists it. */
export interface CompanyOption {
  /** Identifier used in routes; never shown. */
  id: string;
  /** Famous name the identifier hashes to. */
  name: string;
}

/**
 * Builds the options of the company search, sorted by name.
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

/**
 * Strips accents and case so a search matches regardless of how it is typed.
 *
 * @param text - Text to normalise.
 * @returns Lower-case ASCII-folded text.
 */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Narrows the options to those whose name contains the typed text.
 *
 * The identifier also matches, so `COMP_0051` still reaches its company even
 * though it is never shown. The list is capped so the popover never mounts
 * the whole portfolio, and the company in context is always kept in it so
 * the search can display its name while nothing is typed.
 *
 * @param options - Every option, sorted.
 * @param query - Text typed by the reader.
 * @param selectedId - Identifier of the company in context.
 * @param limit - Matches to show; grows page by page with «cargar más».
 * @returns The visible matches, plus the selected company, and the total.
 */
export function filterCompanyOptions(
  options: readonly CompanyOption[],
  query: string,
  selectedId: string,
  limit = VISIBLE_LIMIT,
): CompanyMatches {
  const needle = fold(query.trim());
  const matching = needle
    ? options.filter(
        (option) =>
          fold(option.name).includes(needle) ||
          fold(option.id).includes(needle),
      )
    : [...options];
  const items = matching.slice(0, Math.max(limit, 0));
  if (items.some((option) => option.id === selectedId)) {
    return { items, total: matching.length };
  }
  const selected = options.find((option) => option.id === selectedId);
  return {
    items: selected ? [selected, ...items] : items,
    total: matching.length,
  };
}
