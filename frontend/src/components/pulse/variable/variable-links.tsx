import Link from 'next/link';

import { companyName } from '@/lib/company/names';
import { companyRoutes } from '@/lib/routes';

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
      className="flex flex-col gap-1 text-sm"
    >
      <Link
        className="text-accent underline-offset-4 hover:underline"
        href={routes.pulse}
      >
        Volver al PULSE de {companyName(companyId)}
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
