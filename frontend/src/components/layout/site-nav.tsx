'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { CompanySearch } from '@/components/layout/company-search';
import { MobileNav } from '@/components/layout/mobile-nav';
import { NavSectionLinks } from '@/components/layout/nav-section-links';
import { PulseWordmark } from '@/components/ui/wordmark';
import type { CompanyOption } from '@/lib/company/options';
import { companySections } from '@/lib/company/sections';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import {
  companyIdFromPath,
  companyIdFromQuery,
  companyRoutes,
  COMPANY_QUERY_KEY,
  sectionFromPath,
} from '@/lib/routes';

export { companySections } from '@/lib/company/sections';

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
 * Seven tabs, a search and a mark do not fit one row below `lg`, so there the
 * bar keeps only the mark and one menu button; the search and the sections
 * move into the drawer of {@link MobileNav}. Between `lg` and `xl` the search
 * is 176 px wide and the tabs lose two pixels of padding each side, which is
 * what the seventh tab costs. The prototype's tagline is left
 * out: with the search beside the tabs it no longer fits the 1240 px row, and
 * the landing already carries it. The current tab is the section
 * {@link sectionFromPath} names, so a variable page keeps PULSE current.
 *
 * @param props - The companies the search offers.
 * @returns The mark, the company search and the section links, or the menu.
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
        className="mx-auto flex max-w-[1240px] items-center justify-between gap-x-4 px-4 py-2 sm:px-8 lg:gap-x-6 lg:py-4"
      >
        <Link
          href="/"
          aria-label="Embat Pulse, inicio"
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Image src="/icon.svg" alt="" width={40} height={40} unoptimized />
          <PulseWordmark className="h-3.5" />
        </Link>
        <div className="hidden min-w-0 items-center gap-x-6 lg:flex">
          <div className="w-40 shrink-0 xl:w-64">
            <CompanySearch
              key={companyId}
              companies={companies}
              selectedId={companyId}
              onSelect={switchCompany}
            />
          </div>
          <NavSectionLinks sections={sections} current={current} layout="row" />
        </div>
        <div className="lg:hidden">
          <MobileNav
            companies={companies}
            companyId={companyId}
            sections={sections}
            current={current}
            pathname={pathname}
            onSelectCompany={switchCompany}
          />
        </div>
      </nav>
    </header>
  );
}
