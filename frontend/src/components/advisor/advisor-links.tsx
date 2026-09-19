import Link from 'next/link';

import { companyRoutes } from '@/lib/routes';

interface AdvisorLinksProps {
  companyId: string;
}

/**
 * Points back at the score these offers are priced from and at the method
 * behind it.
 *
 * @param props - Company in context.
 * @returns Two stacked links, aligned with the page heading.
 */
export function AdvisorLinks({ companyId }: AdvisorLinksProps) {
  const routes = companyRoutes(companyId);
  return (
    <nav
      aria-label="Continuar con esta empresa"
      className="flex flex-col gap-1 text-sm"
    >
      <Link
        className="text-accent underline-offset-4 hover:underline"
        href={routes.pulse}
      >
        Ver el PULSE
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
