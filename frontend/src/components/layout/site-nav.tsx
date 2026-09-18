'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DEMO_COMPANY_ID } from '@/lib/xray/demo';

/** Sections of Embat Pulse, in the order the demo walks through them. */
const SECTIONS = [
  { href: '/', label: 'Radar', match: '/' },
  {
    href: `/empresa/${DEMO_COMPANY_ID}`,
    label: 'Radiografía',
    match: '/empresa',
  },
  { href: '/capital', label: 'Capital', match: '/capital' },
  { href: '/monitor', label: 'Monitor', match: '/monitor' },
  { href: '/metodo', label: 'Método', match: '/metodo' },
] as const;

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
 * Renders the top navigation shared by every page.
 *
 * The "Radiografía" entry points at a company with a structural decline, so the
 * demo always has a meaningful example one click away.
 *
 * @returns The product name and the five section links.
 */
export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
      <nav
        aria-label="Secciones"
        className="mx-auto flex max-w-7xl flex-wrap items-baseline gap-x-6 gap-y-2 px-5 py-4 sm:px-8"
      >
        <Link href="/" className="text-base font-semibold tracking-tight">
          Embat Pulse
        </Link>
        <ul className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
          {SECTIONS.map((section) => {
            const active = isActive(pathname, section.match);
            return (
              <li key={section.href}>
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
