import { describe, expect, it } from 'vitest';

import {
  HERO_SECTIONS,
  PRODUCT_SECTIONS,
} from '@/lib/landing/product-sections';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { companyRoutes } from '@/lib/routes';

describe('HERO_SECTIONS', () => {
  it('is PULSE, Recomendaciones and Método of the demo company', () => {
    const demo = companyRoutes(PULSE_DEMO_COMPANY_ID);
    expect(HERO_SECTIONS.map((section) => section.href)).toEqual([
      demo.pulse,
      demo.advisor,
      demo.method,
    ]);
    expect(HERO_SECTIONS).toHaveLength(3);
    expect(HERO_SECTIONS).toEqual(PRODUCT_SECTIONS);
  });
});
