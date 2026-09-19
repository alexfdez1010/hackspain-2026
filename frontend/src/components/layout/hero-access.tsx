import Link from 'next/link';

import { HERO_SECTIONS } from '@/lib/landing/product-sections';

/**
 * Direct access to the company-scoped product from the landing hero.
 *
 * PULSE, Recomendaciones and Método in a 2-column grid. Not a folder tab.
 *
 * @returns A labelled grid of large underlined product links.
 */
export function HeroAccess() {
  return (
    <nav aria-label="Dashboard" className="w-full">
      <ul className="grid w-full grid-cols-2 gap-x-10 gap-y-8">
        {HERO_SECTIONS.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="hero-access-link font-display text-2xl tracking-tight text-foreground transition-colors duration-[120ms] ease-out hover:text-muted sm:text-3xl"
            >
              {section.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
