import Link from 'next/link';

import { companyRoutes } from '@/lib/routes';

interface PulseCompanyLinksProps {
  companyId: string;
}

/**
 * Offers the three destinations a reader of the score usually needs next.
 *
 * Each link says what it leads to, not where it is: the signals page lists
 * when the score really moved, the recommendations turn the score into a
 * limit and a price, the method page explains how the eleven variables become
 * the number shown on this page.
 *
 * @param props - Company in context.
 * @returns Three stacked links, aligned with the page heading.
 */
export function PulseCompanyLinks({ companyId }: PulseCompanyLinksProps) {
  const routes = companyRoutes(companyId);
  return (
    <nav
      aria-label="Continuar con esta empresa"
      className="flex flex-col gap-1 text-sm"
    >
      <Link
        className="text-accent underline-offset-4 hover:underline"
        href={routes.signals}
      >
        Ver alertas y señales
      </Link>
      <Link
        className="text-accent underline-offset-4 hover:underline"
        href={routes.advisor}
      >
        Ver productos recomendados
      </Link>
      <Link
        className="text-muted underline-offset-4 hover:underline"
        href={routes.method}
      >
        Cómo se calcula el PULSE
      </Link>
    </nav>
  );
}
