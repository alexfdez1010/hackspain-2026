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
  type CompanySection,
} from '@/lib/routes';

/** One destination of the navigation. */
interface NavSection {
  /** Section the entry opens, as {@link sectionFromPath} names it. */
  key: CompanySection;
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
 * Builds the sections of the navigation for one company, in the order of
 * the prototype: the summary, where the score is decided, the month-level
 * detail, the signals, the financing and the method.
 *
 * @param companyId - Company in context.
 * @returns The six destinations, in reading order.
 */
export function companySections(companyId: string): NavSection[] {
  const routes = companyRoutes(companyId);
  return [
    { key: 'pulse', href: routes.pulse, label: 'PULSE', match: routes.pulse },
    {
      key: 'diagnosis',
      href: routes.diagnosis,
      label: 'Diagnóstico',
      match: routes.diagnosis,
    },
    {
      key: 'detail',
      href: routes.detail,
      label: 'Detalle',
      match: routes.detail,
    },
    {
      key: 'signals',
      href: routes.signals,
      label: 'Señales',
      match: routes.signals,
    },
    {
      key: 'advisor',
      href: routes.advisor,
      label: 'Financiación',
      match: routes.advisor,
    },
    { key: 'method', href: routes.method, label: 'Método', match: '/method' },
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
 * The bar follows the prototype: the mark on the left, the search and the
 * sections on the right, and a hairline underneath. Nothing floats on a
 * shadow.
 *
 * The sections read as tabs — 8 px of radius, the current one in link blue on
 * `brand-subtle` — but they stay `next/link` anchors with `aria-current`, so
 * every section keeps its own URL and can be opened in a new tab.
 *
 * Six tabs, a search and a mark do not fit one row below `lg`, so there the
 * bar takes two: the mark with the search filling the rest of the first one,
 * and the tabs on their own row with 40 px targets, scrolling sideways instead
 * of wrapping so the bar never grows a third row. The prototype's tagline is
 * left out: with the search beside the tabs it no longer fits the 1240 px
 * row, and the landing already carries it. The current tab is the section
 * {@link sectionFromPath} names, so a variable page keeps PULSE current.
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
  const current = sectionFromPath(pathname);
  const switchCompany = (nextId: string) => {
    router.push(companyRoutes(nextId)[sectionFromPath(pathname)]);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-page/85 backdrop-blur">
      <nav
        aria-label="Secciones"
        className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-2 sm:px-8 lg:flex-nowrap lg:gap-x-6 lg:py-4"
      >
        <Link
          href="/"
          aria-label="Embat Pulse, inicio"
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Image src="/icon.svg" alt="" width={40} height={40} unoptimized />
          <PulseWordmark className="h-3.5" />
        </Link>
        <div className="min-w-0 flex-1 lg:ml-auto lg:w-56 lg:flex-none xl:w-64">
          <CompanySearch
            key={companyId}
            companies={companies}
            selectedId={companyId}
            onSelect={switchCompany}
          />
        </div>
        <ul className="-mx-3 flex basis-full items-center gap-0.5 overflow-x-auto [scrollbar-width:none] lg:mx-0 lg:basis-auto [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => {
            const active = section.key === current;
            return (
              <li key={section.key} className="shrink-0">
                <Link
                  href={section.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-10 items-center rounded-lg px-3 py-[11px] text-[15px] font-medium leading-none whitespace-nowrap transition-colors ${
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
