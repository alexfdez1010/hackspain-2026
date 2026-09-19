import Link from 'next/link';

import { PulseFooterHeatmap } from '@/components/layout/pulse-footer-heatmap';
import { DEMO_COMPANY_ID } from '@/lib/xray/demo';

const PLATFORM = [
  { href: '/radar', label: 'Radar' },
  { href: '/pulse', label: 'PULSE' },
  { href: '/capital', label: 'Capital' },
  { href: '/monitor', label: 'Monitor' },
] as const;

const DOCS = [
  { href: '/metodo', label: 'Método' },
  { href: `/empresa/${DEMO_COMPANY_ID}`, label: 'Radiografía' },
] as const;

/**
 * One labelled column of footer links, left-aligned.
 *
 * @param props - Group title and the routes in that group.
 * @returns A heading and a vertical list.
 */
function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm text-muted">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-foreground transition-colors hover:text-muted"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Full-viewport footer: Heatmap in the left pane, lists and legal on the right.
 *
 * The left inner column is desktop-only. No product mark as a heading here.
 *
 * @returns The framed footer band.
 */
export function LandingFooter() {
  return (
    <footer
      aria-label="Pulse"
      className="grid h-dvh snap-start snap-always grid-cols-[var(--site-gutter)_minmax(0,1fr)_var(--site-gutter)] lg:grid-cols-[var(--site-gutter)_minmax(0,1fr)_minmax(0,1fr)_var(--site-gutter)]"
    >
      <div className="col-start-1" />
      <div className="footer-heatmap relative col-start-2 hidden h-full min-h-0 overflow-hidden lg:block">
        <PulseFooterHeatmap />
      </div>
      <div className="col-start-2 flex h-full flex-col px-6 py-10 sm:px-10 lg:col-start-3">
        <nav aria-label="Pie" className="flex flex-1 items-center">
          <div className="grid w-full grid-cols-2 gap-x-10">
            <FooterLinkGroup title="Platform" links={PLATFORM} />
            <FooterLinkGroup title="Docs" links={DOCS} />
          </div>
        </nav>
        <p className="mt-auto flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
          <span>© 2026 Pulse</span>
          <Link
            href="/condiciones"
            className="transition-colors hover:text-foreground"
          >
            Condiciones de uso
          </Link>
          <Link
            href="/privacidad"
            className="transition-colors hover:text-foreground"
          >
            Política de privacidad
          </Link>
        </p>
      </div>
      <div className="col-start-3 lg:col-start-4" />
    </footer>
  );
}
