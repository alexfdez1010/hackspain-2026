import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { companyRoutes } from '@/lib/routes';

const demoRoutes = companyRoutes(PULSE_DEMO_COMPANY_ID);

/**
 * Product surfaces of the company-scoped app, in reading order.
 *
 * Shared by the landing hero and footer so the endpoints cannot drift.
 */
export const PRODUCT_SECTIONS = [
  { href: demoRoutes.pulse, label: 'PULSE', match: demoRoutes.pulse },
  {
    href: demoRoutes.advisor,
    label: 'Recomendaciones',
    match: demoRoutes.advisor,
  },
  { href: demoRoutes.method, label: 'Método', match: '/method' },
] as const;

/**
 * Working surfaces shown in the landing hero. Same catalogue as the product
 * nav of the demo company.
 *
 * @example
 * ```ts
 * HERO_SECTIONS.map((section) => section.href)
 * // ['/company/COMP_0001', '/company/COMP_0001/recommendations', '/method?company=COMP_0001']
 * ```
 */
export const HERO_SECTIONS = PRODUCT_SECTIONS;
