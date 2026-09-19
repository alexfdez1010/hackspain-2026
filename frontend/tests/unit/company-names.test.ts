import { describe, expect, it } from 'vitest';

import { COMPANY_NAMES, GROUP_NAMES } from '@/lib/company/catalogues';
import { companyName, fnv1a, groupName, hashedName } from '@/lib/company/names';

describe('fnv1a', () => {
  it('matches the reference vectors of 32-bit FNV-1a', () => {
    expect(fnv1a('')).toBe(0x811c9dc5);
    expect(fnv1a('a')).toBe(0xe40c292c);
    expect(fnv1a('foobar')).toBe(0xbf9cf968);
  });
});

describe('hashedName', () => {
  it('is deterministic and always lands inside the catalogue', () => {
    const ids = Array.from(
      { length: 1300 },
      (_, index) => `COMP_${String(index + 1).padStart(4, '0')}`,
    );
    for (const id of ids) {
      const name = hashedName(id, COMPANY_NAMES);
      expect(COMPANY_NAMES).toContain(name);
      expect(hashedName(id, COMPANY_NAMES)).toBe(name);
    }
    const distinct = new Set(ids.map((id) => hashedName(id, COMPANY_NAMES)));
    expect(distinct.size).toBeGreaterThan(COMPANY_NAMES.length * 0.9);
  });

  it('ignores surrounding whitespace and falls back to the identifier', () => {
    expect(hashedName(' COMP_0001 ', COMPANY_NAMES)).toBe(
      hashedName('COMP_0001', COMPANY_NAMES),
    );
    expect(hashedName('', COMPANY_NAMES)).toBe('');
    expect(hashedName('COMP_0001', [])).toBe('COMP_0001');
  });
});

describe('companyName and groupName', () => {
  it('pin the names of the demo companies', () => {
    expect(companyName('COMP_0001')).toBe('Domino’s');
    expect(companyName('COMP_0051')).toBe('Schneider Electric');
    expect(groupName('GROUP_0147')).toBe('HNA Group');
    expect(GROUP_NAMES).toContain(groupName('GROUP_0001'));
    expect(groupName('')).toBe('');
  });
});
