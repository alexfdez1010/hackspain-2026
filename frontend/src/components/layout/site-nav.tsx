'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { CompanySearch } from '@/components/layout/company-search';
import { PulseWordmark } from '@/components/ui/wordmark';
import type { CompanyOption } from '@/lib/company/options';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import {
  companyIdFromPath,
  companyIdFromQuery,
  companyRoutes,
  COMPANY_QUERY_KEY,
  sectionFromPath,
} from '@/lib/routes';

/** One destination of the navigation. */
interface NavSection {
  href: string;
  label: string;
  /** Route prefix owned by the entry. */
  match: string;
}

interface SiteNavProps {
  /** Every company of the export, as the search lists them. */
  companies: readonly CompanyOption[];
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
 * marked as current while the financing page is open.
 *
 * @param companyId - Company in context.
 * @returns PULSE, signals, financing and method, in reading order.
 */
export function companySections(companyId: string): NavSection[] {
  const routes = companyRoutes(companyId);
  return [
    { href: routes.pulse, label: 'PULSE', match: routes.pulse },
    { href: routes.signals, label: 'Señales', match: routes.signals },
    { href: routes.advisor, label: 'Financiación', match: routes.advisor },
    { href: routes.method, label: 'Método', match: '/method' },
  ];
}

/**
 * Resolves the company the navigation should point at.
 *
 * The company comes from the pathname on company pages and from the
 * `company` query parameter on the method page; otherwise the demo company
 * keeps every destination reachable.
 *
 * @param pathname - Current pathname.
 * @param query - Value of the `company` query parameter.
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
 * the company in context is searched right here, and switching it keeps the
 * reader on the section they were reading.
 *
 * The bar follows the prototype: mark, a vertical hairline and the product
 * tagline on the left, the search and the sections on the right, and a
 * hairline underneath. Nothing floats on a shadow.
 *
 * The sections read as tabs — 8 px of radius, the current one in link blue on
 * `brand-subtle` — but they stay `next/link` anchors with `aria-current`, so
 * every section keeps its own URL and can be opened in a new tab.
 *
 * On a phone the bar takes two rows: the product icon and wordmark with the
 * search filling the rest of the first one, and the section links on their own
 * row with 40 px targets. The tagline is dropped below `md`, where it would
 * push the search onto a third row. From `sm` up the rest sits on one row.
 *
 * @param props - The companies the search offers.
 * @returns The mark and tagline, the company search and the section links.
 */
export function SiteNav({ companies }: SiteNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const query = useSearchParams().get(COMPANY_QUERY_KEY);
  const companyId = resolveNavCompany(pathname, query);
  const sections = companySections(companyId);
  const advisorActive = isActive(pathname, sections[1].match);
  const switchCompany = (nextId: string) => {
    router.push(companyRoutes(nextId)[sectionFromPath(pathname)]);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-page/85 backdrop-blur">
      <nav
        aria-label="Secciones"
        className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-2 sm:gap-x-6 sm:px-8 sm:py-4"
      >
        <Link
          href="/"
          aria-label="Embat Pulse, inicio"
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Image src="/icon.svg" alt="" width={40} height={40} unoptimized />
          <PulseWordmark className="h-3.5" />
        </Link>
        <span className="hidden border-l border-hairline pl-4 text-[15px] leading-[1.55] text-ink-secondary md:block">
          La inteligencia que impulsa tu tesorería
        </span>
        <div className="min-w-0 flex-1 sm:ml-auto sm:flex-none">
          <CompanySearch
            key={companyId}
            companies={companies}
            selectedId={companyId}
            onSelect={switchCompany}
          />
        </div>
        <ul className="-mx-3.5 flex basis-full flex-wrap items-center gap-1 sm:basis-auto">
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
                  className={`flex min-h-10 items-center rounded-lg px-3.5 py-[11px] text-base font-medium leading-none transition-colors ${
                    active
                      ? 'text-link-accent bg-brand-subtle'
                      : 'text-ink-secondary hover:text-ink'
                  }`}
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
