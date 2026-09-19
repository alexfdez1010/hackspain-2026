import { describe, expect, it } from 'vitest';

import { isActive } from '@/components/layout/nav-match';

describe('isActive', () => {
  it('marks the radar on /radar, not the marketing home', () => {
    expect(isActive('/radar', '/radar')).toBe(true);
    expect(isActive('/radar/extra', '/radar')).toBe(true);
    expect(isActive('/', '/radar')).toBe(false);
    expect(isActive('/pulse', '/radar')).toBe(false);
  });

  it('marks a section by prefix so nested company pages stay current', () => {
    expect(isActive('/empresa/COMP_0001', '/empresa')).toBe(true);
    expect(isActive('/empresa', '/empresa')).toBe(true);
    expect(isActive('/empresas', '/empresa')).toBe(false);
    expect(isActive('/pulse/COMP_0001', '/pulse')).toBe(true);
  });
});
