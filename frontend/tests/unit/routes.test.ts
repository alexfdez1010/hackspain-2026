import { describe, expect, it } from 'vitest';

import {
  companyIdFromPath,
  companyIdFromQuery,
  companyRoutes,
  companyVariableRoute,
  sectionFromPath,
  variableKeyFromParam,
  variableKeyFromPath,
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
      diagnosis: '/company/COMP_0001/diagnosis',
      detail: '/company/COMP_0001/detail',
      signals: '/company/COMP_0001/signals',
      advisor: '/company/COMP_0001/recommendations',
      method: '/method?company=COMP_0001',
    });
  });
});

describe('companyVariableRoute', () => {
  it('nests the variable under the PULSE page of the company', () => {
    expect(companyVariableRoute('COMP_0001', 'cash_days')).toBe(
      '/company/COMP_0001/variable/cash_days',
    );
    expect(companyVariableRoute('COMP 1', 'cash_days')).toBe(
      '/company/COMP%201/variable/cash_days',
    );
  });
});

describe('variable keys in routes', () => {
  it('accepts the snake_case keys of the export and nothing else', () => {
    expect(variableKeyFromParam('cash_days')).toBe('cash_days');
    expect(variableKeyFromParam('ar90')).toBe('ar90');
    expect(variableKeyFromParam('../x')).toBeNull();
    expect(variableKeyFromParam('CASH_DAYS')).toBeNull();
    expect(variableKeyFromParam('9lives')).toBeNull();
    expect(variableKeyFromParam('')).toBeNull();
    expect(variableKeyFromParam(undefined)).toBeNull();
    expect(variableKeyFromParam('a'.repeat(33))).toBeNull();
  });

  it('reads the variable a pathname opens', () => {
    expect(variableKeyFromPath('/company/COMP_0001/variable/cash_days')).toBe(
      'cash_days',
    );
    expect(variableKeyFromPath('/company/COMP_0001')).toBeNull();
    expect(
      variableKeyFromPath('/company/COMP_0001/variable/cash_days/extra'),
    ).toBeNull();
    expect(variableKeyFromPath('/company/COMP_0001/variable/..')).toBeNull();
  });
});

describe('company identifiers in routes', () => {
  it('reads the company from company pages only', () => {
    expect(companyIdFromPath('/company/COMP_0001')).toBe('COMP_0001');
    expect(companyIdFromPath('/company/COMP_0001/recommendations')).toBe(
      'COMP_0001',
    );
    expect(companyIdFromPath('/company/COMP_0001/variable/cash_days')).toBe(
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

  it('lists the six sections of a company in the order of the prototype', () => {
    const sections = companySections('COMP_0001');
    expect(sections.map((section) => section.label)).toEqual([
      'PULSE',
      'Diagnóstico',
      'Detalle',
      'Señales',
      'Financiación',
      'Método',
    ]);
    expect(sections.map((section) => section.href)).toEqual([
      '/company/COMP_0001',
      '/company/COMP_0001/diagnosis',
      '/company/COMP_0001/detail',
      '/company/COMP_0001/signals',
      '/company/COMP_0001/recommendations',
      '/method?company=COMP_0001',
    ]);
    expect(
      isActive('/company/COMP_0001/recommendations', sections[4].match),
    ).toBe(true);
    expect(isActive('/company/COMP_0001/signals', sections[3].match)).toBe(
      true,
    );
  });
});

describe('sectionFromPath', () => {
  it('names the section so a company switch keeps the reader on it', () => {
    expect(sectionFromPath('/company/COMP_0001')).toBe('pulse');
    expect(sectionFromPath('/company/COMP_0001/recommendations')).toBe(
      'advisor',
    );
    expect(sectionFromPath('/company/COMP_0001/variable/cash_days')).toBe(
      'pulse',
    );
    expect(sectionFromPath('/company/COMP_0001/diagnosis')).toBe('diagnosis');
    expect(sectionFromPath('/company/COMP_0001/detail')).toBe('detail');
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
    expect(filterCompanyOptions(named, 'NESTLE', 'B')).toEqual({
      items: [named[1], named[0]],
      total: 1,
    });
    expect(filterCompanyOptions(named, 'telefo', 'A').items).toEqual([
      named[0],
      named[1],
    ]);
    expect(
      filterCompanyOptions(options, 'comp_0051', 'COMP_0001').items.map(
        (o) => o.id,
      ),
    ).toEqual(['COMP_0001', 'COMP_0051']);
  });

  it('pages the list, counts the whole match and keeps the context', () => {
    const page = filterCompanyOptions(options, '', 'COMP_0200');
    expect(page.items.length).toBe(VISIBLE_LIMIT + 1);
    expect(page.total).toBe(200);
    expect(page.items[0].id).toBe('COMP_0200');
    const more = filterCompanyOptions(options, '', 'COMP_0001', 80);
    expect(more.items.length).toBeLessThanOrEqual(81);
    expect(more.items.length).toBeGreaterThan(VISIBLE_LIMIT);
    expect(filterCompanyOptions(options, 'zzz', 'COMP_0001')).toEqual({
      items: [options.find((option) => option.id === 'COMP_0001')],
      total: 0,
    });
  });
});
