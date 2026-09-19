import { describe, expect, it } from 'vitest';

import {
  companyIdFromPath,
  companyIdFromQuery,
  companyRoutes,
} from '@/lib/routes';
import {
  companySections,
  isActive,
  resolveNavCompany,
} from '@/components/layout/site-nav';
import { filterCompanyIds } from '@/components/entry/company-picker';

describe('companyRoutes', () => {
  it('scopes every destination to the company', () => {
    expect(companyRoutes('COMP_0001')).toEqual({
      pulse: '/empresa/COMP_0001',
      advisor: '/empresa/COMP_0001/recomendaciones',
      method: '/metodo?empresa=COMP_0001',
    });
  });
});

describe('company identifiers in routes', () => {
  it('reads the company from company pages only', () => {
    expect(companyIdFromPath('/empresa/COMP_0001')).toBe('COMP_0001');
    expect(companyIdFromPath('/empresa/COMP_0001/recomendaciones')).toBe(
      'COMP_0001',
    );
    expect(companyIdFromPath('/metodo')).toBeNull();
    expect(companyIdFromPath('/empresa/..%2Fsecret')).toBeNull();
  });

  it('validates the query parameter', () => {
    expect(companyIdFromQuery('COMP_0002')).toBe('COMP_0002');
    expect(companyIdFromQuery(['COMP_0003'])).toBe('COMP_0003');
    expect(companyIdFromQuery('../x')).toBeNull();
    expect(companyIdFromQuery(undefined)).toBeNull();
  });
});

describe('navigation', () => {
  it('keeps the company from the path, then the query, then the demo', () => {
    expect(resolveNavCompany('/empresa/COMP_0009', 'COMP_0001')).toBe(
      'COMP_0009',
    );
    expect(resolveNavCompany('/metodo', 'COMP_0007')).toBe('COMP_0007');
    expect(resolveNavCompany('/', null)).toBe('COMP_0001');
  });

  it('marks the advisor and not PULSE while the recommendations are open', () => {
    const sections = companySections('COMP_0001');
    expect(sections.map((section) => section.label)).toEqual([
      'PULSE',
      'Recomendaciones',
      'Método',
    ]);
    expect(
      isActive('/empresa/COMP_0001/recomendaciones', sections[1].match),
    ).toBe(true);
    expect(isActive('/metodo', '/metodo')).toBe(true);
    expect(isActive('/metodo', '/')).toBe(false);
  });
});

describe('filterCompanyIds', () => {
  const ids = ['COMP_0001', 'COMP_0010', 'COMP_0100', 'COMP_1000'];

  it('matches case-insensitively anywhere in the identifier', () => {
    expect(filterCompanyIds(ids, 'comp_00')).toEqual([
      'COMP_0001',
      'COMP_0010',
    ]);
    expect(filterCompanyIds(ids, '1000')).toEqual(['COMP_1000']);
  });

  it('caps the list before anything is typed', () => {
    const many = Array.from({ length: 100 }, (_, index) => `COMP_${index}`);
    expect(filterCompanyIds(many, '')).toHaveLength(40);
  });
});
