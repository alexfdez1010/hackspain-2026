import { describe, expect, it } from 'vitest';

import {
  HERO_SECTIONS,
  PRODUCT_SECTIONS,
} from '@/lib/landing/product-sections';

describe('HERO_SECTIONS', () => {
  it('is Radar, PULSE, Capital and Monitor from the product catalogue', () => {
    expect(HERO_SECTIONS.map((section) => section.href)).toEqual([
      '/radar',
      '/pulse',
      '/capital',
      '/monitor',
    ]);
    expect(HERO_SECTIONS).toHaveLength(4);
    for (const section of HERO_SECTIONS) {
      expect(PRODUCT_SECTIONS).toContainEqual(section);
    }
  });
});
