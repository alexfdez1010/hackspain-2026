/** Identifiers accepted in a route: letters, digits, underscore and dash. */
export const COMPANY_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Query parameter that carries the company on pages that are not company-scoped. */
export const COMPANY_QUERY_KEY = 'company';

/** The three destinations of the app, keyed as {@link CompanyRoutes}. */
export type CompanySection = 'pulse' | 'advisor' | 'method';

/** Every destination of the app for one company. */
export interface CompanyRoutes {
  /** PULSE of the company: score, history, forecast. */
  pulse: string;
  /** Financial products recommended for the company. */
  advisor: string;
  /** How PULSE is built, keeping the company in context. */
  method: string;
}

/**
 * Builds the three destinations of a company.
 *
 * @param companyId - Identifier such as `COMP_0001`.
 * @returns The routes of the PULSE view, the advisor and the method page.
 */
export function companyRoutes(companyId: string): CompanyRoutes {
  const id = encodeURIComponent(companyId);
  return {
    pulse: `/company/${id}`,
    advisor: `/company/${id}/recommendations`,
    method: `/method?${COMPANY_QUERY_KEY}=${id}`,
  };
}

/**
 * Reads the company a pathname belongs to.
 *
 * @param pathname - Current pathname, such as `/company/COMP_0001/recommendations`.
 * @returns The company identifier, or `null` outside the company routes.
 */
export function companyIdFromPath(pathname: string): string | null {
  const match = /^\/company\/([^/]+)/.exec(pathname);
  if (!match) return null;
  const id = decodeURIComponent(match[1]);
  return COMPANY_ID_PATTERN.test(id) ? id : null;
}

/**
 * Validates a company identifier coming from a query string.
 *
 * @param value - Raw query value.
 * @returns The identifier, or `null` when absent or unsafe.
 */
export function companyIdFromQuery(
  value: string | string[] | null | undefined,
): string | null {
  const id = Array.isArray(value) ? value[0] : value;
  return id && COMPANY_ID_PATTERN.test(id) ? id : null;
}

/**
 * Tells which section of the app a pathname shows.
 *
 * Used to keep the reader on the same section when they switch company from
 * the navigation.
 *
 * @param pathname - Current pathname.
 * @returns The section; unknown paths count as the PULSE view.
 */
export function sectionFromPath(pathname: string): CompanySection {
  if (pathname === '/method') return 'method';
  if (companyIdFromPath(pathname) && pathname.endsWith('/recommendations')) {
    return 'advisor';
  }
  return 'pulse';
}
