'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { PulseWordmark } from '@/components/layout/pulse-wordmark';
import { isActive } from '@/components/layout/nav-match';
import { PRODUCT_SECTIONS } from '@/lib/landing/product-sections';

/**
 * Renders the top navigation shared by every page.
 *
 * The "Radiografía" entry points at a company with a structural decline, so the
 * demo always has a meaningful example one click away.
 *
 * @returns The wordmark and the six section links.
 */
export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
      <nav
        aria-label="Secciones"
        className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 sm:px-8"
      >
        <Link href="/" aria-label="Embat Pulse" className="text-foreground">
          <PulseWordmark />
        </Link>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          {PRODUCT_SECTIONS.map((section) => {
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
