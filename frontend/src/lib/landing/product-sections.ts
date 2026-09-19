import { companySections } from '@/lib/company/sections';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';

/**
 * Product surfaces of the company-scoped app, in reading order.
 *
 * The same catalogue the product nav shows for the demo company, so the
 * landing hero and footer can never list a page that does not exist or miss
 * one that does.
 */
export const PRODUCT_SECTIONS = companySections(PULSE_DEMO_COMPANY_ID);

/**
 * Working surfaces shown in the landing hero. Same catalogue as the product
 * nav of the demo company.
 *
 * @example
 * ```ts
 * HERO_SECTIONS.map((section) => section.label)
 * // ['PULSE', 'Diagnóstico', 'Detalle', 'Alertas', 'Financiación', 'Método']
 * ```
 */
export const HERO_SECTIONS = PRODUCT_SECTIONS;

/** Footer group of a section: the working surfaces or the documentation. */
export type FooterGroup = 'platform' | 'docs';

/**
 * Tells which footer column a section belongs to.
 *
 * @param key - Section key of the catalogue.
 * @returns `docs` for the method page, `platform` for every working surface.
 */
export function footerGroup(key: string): FooterGroup {
  return key === 'method' ? 'docs' : 'platform';
}
