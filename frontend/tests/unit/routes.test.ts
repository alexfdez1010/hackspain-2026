import { describe, expect, it } from 'vitest';

import {
  companyIdFromPath,
  companyIdFromQuery,
  companyRoutes,
  sectionFromPath,
} from '@/lib/routes';
import {
  companySections,
  isActive,
  resolveNavCompany,
} from '@/components/layout/site-nav';
import {
  buildCompanyOptions,
  filterCompanyOptions,
  VISIBLE_LIMIT,
} from '@/lib/company/options';

describe('companyRoutes', () => {
  it('scopes every destination to the company', () => {
    expect(companyRoutes('COMP_0001')).toEqual({
      pulse: '/company/COMP_0001',
      advisor: '/company/COMP_0001/recommendations',
      method: '/method?company=COMP_0001',
    });
  });
});

describe('company identifiers in routes', () => {
  it('reads the company from company pages only', () => {
    expect(companyIdFromPath('/company/COMP_0001')).toBe('COMP_0001');
    expect(companyIdFromPath('/company/COMP_0001/recommendations')).toBe(
      'COMP_0001',
    );
    expect(companyIdFromPath('/method')).toBeNull();
    expect(companyIdFromPath('/company/..%2Fsecret')).toBeNull();
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
    expect(resolveNavCompany('/company/COMP_0009', 'COMP_0001')).toBe(
      'COMP_0009',
    );
    expect(resolveNavCompany('/method', 'COMP_0007')).toBe('COMP_0007');
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
      isActive('/company/COMP_0001/recommendations', sections[1].match),
    ).toBe(true);
    expect(isActive('/method', '/method')).toBe(true);
    expect(isActive('/method', '/')).toBe(false);
  });
});

describe('sectionFromPath', () => {
  it('names the section so a company switch keeps the reader on it', () => {
    expect(sectionFromPath('/company/COMP_0001')).toBe('pulse');
    expect(sectionFromPath('/company/COMP_0001/recommendations')).toBe(
      'advisor',
    );
    expect(sectionFromPath('/method')).toBe('method');
    expect(sectionFromPath('/')).toBe('pulse');
    expect(sectionFromPath('/other/recommendations')).toBe('pulse');
  });
});

describe('buildCompanyOptions', () => {
  it('names every company and sorts by name, then by identifier', () => {
    const options = buildCompanyOptions([
      'COMP_9999',
      'COMP_0051',
      'COMP_0001',
    ]);
    expect(options.map((option) => option.name)).toEqual([
      'Atlassian Global',
      'Atresmedia Labs',
      'Ørsted Global',
    ]);
    expect(options.map((option) => option.id)).toEqual([
      'COMP_0051',
      'COMP_0001',
      'COMP_9999',
    ]);
  });
});

describe('filterCompanyOptions', () => {
  const options = buildCompanyOptions(
    Array.from(
      { length: 200 },
      (_, index) => `COMP_${String(index + 1).padStart(4, '0')}`,
    ),
  );

  it('matches names without accents or case and identifiers too', () => {
    const named = [
      { id: 'A', name: 'Nestlé Iberia' },
      { id: 'B', name: 'Telefónica' },
    ];
    expect(filterCompanyOptions(named, 'NESTLE', 'B')).toEqual([
      named[1],
      named[0],
    ]);
    expect(filterCompanyOptions(named, 'telefo', 'A')).toEqual([
      named[0],
      named[1],
    ]);
    expect(
      filterCompanyOptions(options, 'comp_0051', 'COMP_0001').map((o) => o.id),
    ).toEqual(['COMP_0001', 'COMP_0051']);
  });

  it('caps the list and keeps the company in context in it', () => {
    const list = filterCompanyOptions(options, '', 'COMP_0200');
    expect(list.length).toBeLessThanOrEqual(VISIBLE_LIMIT + 1);
    expect(list.some((option) => option.id === 'COMP_0200')).toBe(true);
    expect(filterCompanyOptions(options, 'zzz', 'COMP_0001')).toEqual([
      options.find((option) => option.id === 'COMP_0001'),
    ]);
  });
});
