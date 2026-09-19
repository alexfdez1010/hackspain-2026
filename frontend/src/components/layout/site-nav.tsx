'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import {
  companyIdFromPath,
  companyIdFromQuery,
  companyRoutes,
  COMPANY_QUERY_KEY,
} from '@/lib/routes';

/** One destination of the navigation. */
interface NavSection {
  href: string;
  label: string;
  /** Route prefix owned by the entry. */
  match: string;
}

/**
 * Decides whether a navigation entry matches the current route.
 *
 * @param pathname - Current pathname.
 * @param match - Route prefix owned by the entry.
 * @returns `true` when the entry should be marked as current.
 */
export function isActive(pathname: string, match: string): boolean {
  if (match === '/') return pathname === '/';
  return pathname === match || pathname.startsWith(`${match}/`);
}

/**
 * Builds the sections of the navigation for one company.
 *
 * The advisor entry matches only its own route, so the PULSE entry is not
 * marked as current while the recommendations are open.
 *
 * @param companyId - Company in context.
 * @returns PULSE, recommendations and method, in reading order.
 */
export function companySections(companyId: string): NavSection[] {
  const routes = companyRoutes(companyId);
  return [
    { href: routes.pulse, label: 'PULSE', match: routes.pulse },
    { href: routes.advisor, label: 'Recomendaciones', match: routes.advisor },
    { href: routes.method, label: 'Método', match: '/metodo' },
  ];
}

/**
 * Resolves the company the navigation should point at.
 *
 * The company comes from the pathname on company pages and from the
 * `empresa` query parameter on the method page; otherwise the demo company
 * keeps every destination reachable.
 *
 * @param pathname - Current pathname.
 * @param query - Value of the `empresa` query parameter.
 * @returns A company identifier.
 */
export function resolveNavCompany(
  pathname: string,
  query: string | null,
): string {
  return (
    companyIdFromPath(pathname) ??
    companyIdFromQuery(query) ??
    PULSE_DEMO_COMPANY_ID
  );
}

/**
 * Renders the top navigation shared by every page.
 *
 * Every destination is scoped to one company: there is no portfolio view, so
 * the company in context is always visible next to the product name, with a
 * link to change it.
 *
 * @returns The product name, the company in context and the section links.
 */
export function SiteNav() {
  const pathname = usePathname();
  const query = useSearchParams().get(COMPANY_QUERY_KEY);
  const companyId = resolveNavCompany(pathname, query);
  const sections = companySections(companyId);
  const advisorActive = isActive(pathname, sections[1].match);

  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
      <nav
        aria-label="Secciones"
        className="mx-auto flex max-w-7xl flex-wrap items-baseline gap-x-6 gap-y-2 px-5 py-4 sm:px-8"
      >
        <Link href="/" className="text-base font-semibold tracking-tight">
          Embat Pulse
        </Link>
        <Link
          href="/"
          className="font-mono text-sm text-muted transition-colors hover:text-foreground"
          title="Cambiar de empresa"
        >
          {companyId}
        </Link>
        <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
          {sections.map((section, index) => {
            const active =
              index === 0
                ? isActive(pathname, section.match) && !advisorActive
                : isActive(pathname, section.match);
            return (
              <li key={section.label}>
                <Link
                  href={section.href}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'text-foreground underline decoration-2 underline-offset-8'
                      : 'text-muted transition-colors hover:text-foreground'
                  }
                >
                  {section.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
