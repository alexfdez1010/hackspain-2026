import type { CompanySection } from '@/lib/routes';
import { companyRoutes } from '@/lib/routes';

/** One destination of the navigation. */
export interface NavSection {
  /** Section the entry opens, as `sectionFromPath` names it. */
  key: CompanySection;
  href: string;
  label: string;
  /** Route prefix owned by the entry. */
  match: string;
}

/**
 * Builds the sections of the navigation for one company, in the order of
 * the prototype: the summary, where the score is decided, the three next
 * steps, the month-level detail, the signals, the financing and the method.
 *
 * Shared by the product nav, the landing hero and the landing footer so the
 * catalogue of pages cannot drift between marketing and product.
 *
 * @param companyId - Company in context.
 * @returns The destinations, in reading order.
 */
export function companySections(companyId: string): NavSection[] {
  const routes = companyRoutes(companyId);
  return [
    { key: 'pulse', href: routes.pulse, label: 'PULSE', match: routes.pulse },
    {
      key: 'diagnosis',
      href: routes.diagnosis,
      label: 'Diagnóstico',
      match: routes.diagnosis,
    },
    {
      key: 'action',
      href: routes.action,
      label: 'Acción',
      match: routes.action,
    },
    {
      key: 'detail',
      href: routes.detail,
      label: 'Detalle',
      match: routes.detail,
    },
    {
      key: 'signals',
      href: routes.signals,
      label: 'Alertas',
      match: routes.signals,
    },
    {
      key: 'advisor',
      href: routes.advisor,
      label: 'Financiación',
      match: routes.advisor,
    },
    { key: 'method', href: routes.method, label: 'Método', match: '/method' },
  ];
}
