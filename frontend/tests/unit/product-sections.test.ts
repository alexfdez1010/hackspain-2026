import { describe, expect, it } from 'vitest';

import { companySections } from '@/lib/company/sections';
import {
  footerGroup,
  HERO_SECTIONS,
  PRODUCT_SECTIONS,
} from '@/lib/landing/product-sections';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { companyRoutes } from '@/lib/routes';

describe('PRODUCT_SECTIONS', () => {
  it('is the product nav of the demo company, so no page is missing', () => {
    const demo = companyRoutes(PULSE_DEMO_COMPANY_ID);
    expect(PRODUCT_SECTIONS).toEqual(companySections(PULSE_DEMO_COMPANY_ID));
    const hrefs = PRODUCT_SECTIONS.map((section) => section.href);
    expect(hrefs).toContain(demo.pulse);
    expect(hrefs).toContain(demo.diagnosis);
    expect(hrefs).toContain(demo.detail);
    expect(hrefs).toContain(demo.signals);
    expect(hrefs).toContain(demo.advisor);
    expect(hrefs).toContain(demo.method);
    expect(HERO_SECTIONS).toEqual(PRODUCT_SECTIONS);
  });

  it('puts only the method in the docs column of the footer', () => {
    expect(footerGroup('method')).toBe('docs');
    expect(footerGroup('pulse')).toBe('platform');
    expect(footerGroup('advisor')).toBe('platform');
  });
});
