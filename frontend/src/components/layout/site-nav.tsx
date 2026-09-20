'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { CompanySearch } from '@/components/layout/company-search';
import { MobileNav } from '@/components/layout/mobile-nav';
import { NavSectionLinks } from '@/components/layout/nav-section-links';
import { PulseWordmark } from '@/components/ui/wordmark';
import { PRODUCT_TAGLINE } from '@/lib/brand';
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
 * From `lg` the bar is the two rows of the prototype: the mark, a hairline
 * and the claim on the left with the company search on the right, and under
 * them the seven sections as tabs on one hairline, the current one marked by
 * a 2 px rule in brand blue. Nothing is sticky and nothing floats on a
 * shadow: the page scrolls under the header as the prototype does.
 *
 * Below `lg` the bar keeps only the mark and one menu button; the search and
 * the sections move into the drawer of {@link MobileNav}. The current tab is
 * the section {@link sectionFromPath} names, so a variable page keeps PULSE
 * current.
 *
 * @param props - The companies the search offers.
 * @returns The mark, the company search and the section tabs, or the menu.
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
    <header className="bg-page">
      <nav
        aria-label="Secciones"
        className="mx-auto max-w-[1240px] px-4 sm:px-8"
      >
        <div className="flex items-center justify-between gap-x-4 border-b border-hairline py-2 lg:min-h-[92px] lg:border-b-0 lg:py-4 lg:pb-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/"
              aria-label="Embat Pulse, inicio"
              className="flex h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <Image
                src="/icon.svg"
                alt=""
                width={40}
                height={40}
                unoptimized
              />
              <PulseWordmark className="h-3.5" />
            </Link>
            <p className="hidden border-l border-hairline pl-4 text-[15px] leading-none text-ink-secondary lg:block">
              {PRODUCT_TAGLINE}
            </p>
          </div>
          <div className="hidden w-64 shrink-0 lg:block">
            <CompanySearch
              key={companyId}
              companies={companies}
              selectedId={companyId}
              onSelect={switchCompany}
            />
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
        </div>
        <div className="hidden border-b border-hairline lg:block">
          <NavSectionLinks sections={sections} current={current} layout="row" />
        </div>
      </nav>
    </header>
  );
}
