import Link from 'next/link';
import type { ReactNode } from 'react';

import { companyName } from '@/lib/company/names';
import { companyRoutes } from '@/lib/routes';

interface ArrowLinkProps {
  href: string;
  /** Secondary link of the pair, one step back in the ink scale. */
  muted?: boolean;
  children: ReactNode;
}

/**
 * A section link of the brand: ink, never blue, closed by an arrow that steps
 * 4 px to the right on hover.
 *
 * @param props - Target, emphasis and the label of the link.
 * @returns The link with its arrow.
 */
function ArrowLink({ href, muted = false, children }: ArrowLinkProps) {
  return (
    <Link
      data-arrow
      href={href}
      className={`group inline-flex items-center gap-1.5 text-[15px] font-medium leading-[1.2] ${
        muted ? 'text-ink-secondary' : 'text-ink'
      }`}
    >
      {children}
      <i
        aria-hidden
        className="not-italic transition-transform group-hover:translate-x-1"
      >
        →
      </i>
    </Link>
  );
}

interface PulseVariableLinksProps {
  companyId: string;
}

/**
 * Returns the reader to the two pages that give this variable its context:
 * the score it feeds and the specification that assigns it its weight.
 *
 * @param props - Company in context.
 * @returns Two stacked links, aligned with the page heading.
 */
export function PulseVariableLinks({ companyId }: PulseVariableLinksProps) {
  const routes = companyRoutes(companyId);
  return (
    <nav
      aria-label="Volver a la empresa"
      className="flex flex-col items-start gap-2"
    >
      <ArrowLink href={routes.pulse}>
        Volver al PULSE de {companyName(companyId)}
      </ArrowLink>
      <ArrowLink href={routes.method} muted>
        Cómo se calcula el PULSE
      </ArrowLink>
    </nav>
  );
}
