import { DEMO_COMPANY_ID } from '@/lib/xray/demo';

/**
 * Product surfaces, in the order the demo walks through them.
 *
 * Shared by the product nav so the endpoints cannot drift. The landing hero
 * uses `HERO_SECTIONS`, a working subset of these same records.
 */
export const PRODUCT_SECTIONS = [
  { href: '/radar', label: 'Radar', match: '/radar' },
  {
    href: `/empresa/${DEMO_COMPANY_ID}`,
    label: 'Radiografía',
    match: '/empresa',
  },
  { href: '/pulse', label: 'PULSE', match: '/pulse' },
  { href: '/capital', label: 'Capital', match: '/capital' },
  { href: '/monitor', label: 'Monitor', match: '/monitor' },
  { href: '/metodo', label: 'Método', match: '/metodo' },
] as const;

type ProductSection = (typeof PRODUCT_SECTIONS)[number];

const HERO_HREFS = ['/radar', '/pulse', '/capital', '/monitor'] as const;

/**
 * Resolves a product section by its href.
 *
 * @param href - A href that already exists on `PRODUCT_SECTIONS`.
 * @returns The matching section record.
 * @throws If the catalogue no longer contains that href.
 */
function sectionByHref(href: (typeof HERO_HREFS)[number]): ProductSection {
  const section = PRODUCT_SECTIONS.find((item) => item.href === href);
  if (!section) {
    throw new Error(`Missing product section: ${href}`);
  }
  return section;
}

/**
 * Four working surfaces shown in the landing hero (Radar, PULSE, Capital,
 * Monitor). Método stays in the footer Docs list; Radiografía opens from Radar
 * and the product nav.
 *
 * @example
 * ```ts
 * HERO_SECTIONS.map((section) => section.href)
 * // ['/radar', '/pulse', '/capital', '/monitor']
 * ```
 */
export const HERO_SECTIONS = HERO_HREFS.map(sectionByHref);
