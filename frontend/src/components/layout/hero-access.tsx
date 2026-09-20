import Link from 'next/link';
import type { ReactNode } from 'react';

import { HERO_SECTIONS } from '@/lib/landing/product-sections';

const HERO_ACCESS_LINK =
  'hero-access-link font-display text-xl font-normal tracking-tight text-foreground transition-colors duration-[120ms] ease-out hover:text-muted lg:text-3xl';

/**
 * One destination in the hero grid, with the shared underline treatment.
 *
 * @param props - Route and visible label.
 * @returns The underlined product link.
 */
function HeroAccessLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={HERO_ACCESS_LINK}>
      {children}
    </Link>
  );
}

/**
 * Direct access to the company-scoped product from the landing hero.
 *
 * Every demo company page in a 2-column grid. Type and row gap stay compact
 * below `lg` so seven destinations fit a phone viewport. PULSE is the page
 * `h1` so the name is written once. Not a folder tab.
 *
 * @returns A labelled grid of large underlined product links.
 */
export function HeroAccess() {
  const [pulse, ...rest] = HERO_SECTIONS;

  return (
    <nav aria-label="Dashboard" className="w-full">
      <ul className="grid w-full grid-cols-2 gap-x-6 gap-y-4 lg:gap-x-10 lg:gap-y-8">
        <li>
          <h1 className="m-0 font-normal">
            <HeroAccessLink href={pulse.href}>{pulse.label}</HeroAccessLink>
          </h1>
        </li>
        {rest.map((section) => (
          <li key={section.href}>
            <HeroAccessLink href={section.href}>{section.label}</HeroAccessLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
