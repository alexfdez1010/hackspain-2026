import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFrame } from '@/components/layout/site-frame';
import { PRODUCT_SECTIONS } from '@/lib/landing/product-sections';

export const metadata: Metadata = {
  title: 'Página no encontrada · Embat Pulse',
};

/**
 * The 404 of every route, rendered inside the landing frame so it reads as
 * part of the site rather than as an error screen.
 *
 * It names the state once, then offers the three product surfaces of the demo
 * company, the same catalogue as the landing hero, so nobody has to guess a
 * URL. `notFound()` from a company page lands here too.
 *
 * @returns The framed 404 page.
 */
export default function NotFound() {
  return (
    <SiteFrame>
      <main className="grid min-h-dvh grid-cols-[var(--site-gutter)_minmax(0,1fr)_var(--site-gutter)]">
        <div className="col-start-2 flex flex-col justify-center gap-10 px-6 py-16 sm:px-10">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="text-[13px] leading-[1.2] font-semibold tracking-[0.06em] text-ink-secondary uppercase">
              Error 404
            </p>
            <h1 className="text-[30px] leading-[1.15] font-semibold tracking-[-0.015em] sm:text-[40px]">
              Esta página no existe
            </h1>
            <p className="text-[15px] leading-[1.55] text-ink-secondary">
              La dirección no corresponde a ninguna empresa ni sección de Embat
              Pulse.
            </p>
          </div>
          <nav aria-label="Dashboard">
            <ul className="flex flex-wrap gap-x-10 gap-y-4">
              {PRODUCT_SECTIONS.map((section) => (
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
        </div>
      </main>
    </SiteFrame>
  );
}
