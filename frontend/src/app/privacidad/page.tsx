import type { Metadata } from 'next';
import Link from 'next/link';

import { PageShell } from '@/components/layout/page-shell';

export const metadata: Metadata = {
  title: 'Política de privacidad · Pulse',
};

/**
 * Demo privacy note: there is no account and no personal data is collected.
 *
 * @returns The privacy page.
 */
export default function PrivacyPage() {
  return (
    <PageShell
      title="Política de privacidad"
      lead="Esta demo no tiene cuentas de usuario ni formularios. No se recogen datos personales en el navegador."
    >
      <p className="max-w-3xl text-muted">
        Las fichas de empresa son identificadores sintéticos del corte (por
        ejemplo COMP_0760), no personas. El servidor de esta interfaz no guarda
        sesión ni cookies de seguimiento.
      </p>
      <p>
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          Volver
        </Link>
      </p>
    </PageShell>
  );
}
