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
  });

  it('gives distinct names to consecutive identifiers while slots last', () => {
    const suffixes = ['', 'Iberia', 'Europe'];
    const slots = COMPANY_NAMES.length * suffixes.length;
    const ids = Array.from({ length: slots }, (_, index) => `COMP_${index}`);
    const names = ids.map((id) => hashedName(id, COMPANY_NAMES, suffixes));
    expect(new Set(names).size).toBe(slots);
    expect(names.every((name) => /^\S.*(\s(Iberia|Europe))?$/.test(name))).toBe(
      true,
    );
    expect(hashedName('ACME', COMPANY_NAMES, suffixes)).toBe(
      hashedName('ACME', COMPANY_NAMES, suffixes),
    );
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
    expect(companyName('COMP_0001')).toBe('Atresmedia Labs');
    expect(companyName('COMP_0051')).toBe('Atlassian Global');
    expect(groupName('GROUP_0147')).toBe('Grupo Ebro');
    expect(GROUP_NAMES).toContain(groupName('GROUP_0001'));
    expect(groupName('')).toBe('');
  });

  it('never repeat across the export and its groups', () => {
    const companies = Array.from(
      { length: 1285 },
      (_, index) => `COMP_${String(index + 1).padStart(4, '0')}`,
    );
    expect(new Set(companies.map(companyName)).size).toBe(companies.length);
    const groups = Array.from(
      { length: 250 },
      (_, index) => `GROUP_${String(index + 1).padStart(4, '0')}`,
    );
    expect(new Set(groups.map(groupName)).size).toBe(groups.length);
  });
});
