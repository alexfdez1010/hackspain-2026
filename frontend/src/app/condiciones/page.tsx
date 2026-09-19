import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Condiciones de uso · Pulse',
};

/**
 * Demo terms: what this surface is and that it is not a contractual offer.
 *
 * @returns The terms page.
 */
export default function TermsPage() {
  return (
    <PageShell
      title="Condiciones de uso"
      lead="Pulse muestra un corte mensual de 1.286 pymes. No abre cuenta, no origina crédito y no sustituye un contrato de línea."
    >
      <p className="max-w-3xl text-muted">
        Los scores, límites y precios son una demostración sobre datos ya
        publicados. Quien opera el corte es Pulse; el uso de esta interfaz no
        crea obligación de financiación ni de prima.
      </p>
      <p>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          Volver
        </Link>
      </p>
    </PageShell>
  );
}
