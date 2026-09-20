import Link from 'next/link';

import { PulseFooterDither } from '@/components/layout/pulse-footer-dither';
import { PulseFooterHeatmap } from '@/components/layout/pulse-footer-heatmap';
import { footerGroup, PRODUCT_SECTIONS } from '@/lib/landing/product-sections';

const PLATFORM = PRODUCT_SECTIONS.filter(
  (section) => footerGroup(section.key) === 'platform',
);
const DOCS = PRODUCT_SECTIONS.filter(
  (section) => footerGroup(section.key) === 'docs',
);

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
      <p className="text-[13px] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-muted">
        {title}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-[15px] text-foreground transition-colors hover:text-muted"
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
 * Full-viewport footer: Heatmap in the left pane, dithered lists on the right.
 *
 * The left inner column is desktop-only. No product mark as a heading here.
 * The bottom line is the copyright and the same signature as the product
 * footer, with no hairline and no description of the model.
 *
 * @returns The framed footer band.
 */
export function LandingFooter() {
  return (
    <footer
      aria-label="Pulse"
      className="landing-band-dark grid h-dvh snap-start snap-always grid-cols-[var(--site-gutter)_minmax(0,1fr)_var(--site-gutter)] lg:grid-cols-[var(--site-gutter)_minmax(0,1fr)_minmax(0,1fr)_var(--site-gutter)]"
    >
      <div className="col-start-1" />
      <div className="footer-heatmap relative col-start-2 hidden h-full min-h-0 overflow-hidden lg:block">
        <PulseFooterHeatmap />
      </div>
      <div className="relative col-start-2 flex h-full flex-col px-[var(--landing-inset)] py-10 lg:col-start-3">
        <div className="footer-dither pointer-events-none absolute inset-0 overflow-hidden">
          <PulseFooterDither />
        </div>
        <nav
          aria-label="Pie"
          className="relative z-[1] flex flex-1 items-center"
        >
          <div className="grid w-full grid-cols-2 gap-x-10">
            <FooterLinkGroup title="Producto" links={PLATFORM} />
            <FooterLinkGroup title="Documentación" links={DOCS} />
          </div>
        </nav>
        <p className="relative z-[1] mt-auto flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pt-6 text-[13px] leading-[1.45] text-muted">
          <span>© 2026 Pulse</span>
          <span>By humans for humans.</span>
        </p>
      </div>
      <div className="col-start-3 lg:col-start-4" />
    </footer>
  );
}
