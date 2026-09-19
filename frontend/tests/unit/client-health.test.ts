import { describe, expect, it } from 'vitest';

import { clientHealth } from '@/lib/pulse/client-health';
import type {
  NetworkCustomer,
  PulseCompanyDetails,
} from '@/lib/pulse/details/types';
import { clientHealthHint } from '@/lib/pulse/header-stats';

/** Details with only the customers the figure reads. */
function details(customers: Partial<NetworkCustomer>[]): PulseCompanyDetails {
  return {
    companyId: 'COMP_0001',
    month: '2026-08',
    variables: {
      network: {
        customers: customers.map((customer) => ({
          counterpartyId: 'C',
          billed6m: null,
          share: null,
          health: null,
          healthD3: null,
          nCompanies: 1,
          ...customer,
        })),
        months: [],
      },
    } as unknown as PulseCompanyDetails['variables'],
  };
}

describe('clientHealth', () => {
  it('weights each customer by what it was billed and scores over 100', () => {
    const result = clientHealth(
      details([
        { billed6m: 300, health: 1 },
        { billed6m: 100, health: 0.2 },
      ]),
    );
    expect(result).toEqual({ score: 80, customers: 2 });
  });

  it('counts every customer the same when nothing was billed', () => {
    const result = clientHealth(
      details([
        { billed6m: 0, health: 1 },
        { billed6m: null, health: 0.5 },
      ]),
    );
    expect(result?.score).toBeCloseTo(75);
  });

  it('skips customers without a measured health', () => {
    expect(
      clientHealth(
        details([
          { billed6m: 500, health: null },
          { billed6m: 10, health: 0.4 },
        ]),
      ),
    ).toEqual({ score: 40, customers: 1 });
    expect(clientHealth(details([{ billed6m: 500 }]))).toEqual({
      score: null,
      customers: 0,
    });
  });

  it('reads no detail as no figure at all', () => {
    expect(clientHealth(null)).toBeNull();
  });
});

describe('clientHealthHint', () => {
  it('names the band and the customers behind the figure', () => {
    expect(clientHealthHint({ score: 80, customers: 2 })).toBe(
      'Sólido · 2 clientes por facturación',
    );
    expect(clientHealthHint({ score: 20, customers: 1 })).toBe(
      'Crítico · 1 cliente por facturación',
    );
  });

  it('says what is missing when there is nothing to average', () => {
    expect(clientHealthHint({ score: null, customers: 0 })).toBe(
      'Sin clientes con facturas en 6 meses',
    );
    expect(clientHealthHint(null)).toBe('Sin detalle de clientes publicado');
  });
});
