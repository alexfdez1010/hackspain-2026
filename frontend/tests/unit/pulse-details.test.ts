import { describe, expect, it } from 'vitest';

import { counterpartyName } from '@/lib/company/names';
import { parsePulseCompanyDetails } from '@/lib/pulse/details/parse';
import { camelCase, parseMonths, parseRows } from '@/lib/pulse/details/rows';
import { NETWORK_CUSTOMER_SPEC } from '@/lib/pulse/details/specs';
import { ApiPulseSource } from '@/lib/pulse/source/api';

const PAYLOAD = {
  company_id: 'COMP_0001',
  month: '2026-08',
  variables: {
    cash_days: {
      daily: [
        { day: '2026-08-30', balance: 100.5 },
        { day: '2026-08-31', balance: 'oops' },
      ],
      daily_outflow: 12.5,
      accounts: [
        {
          product_id: 'PRODUCT_1',
          label: 'CHECKING_01',
          bank: 'Banco Sabadell',
          type: 'checking',
          balance: 90,
        },
      ],
      months: [
        { month: '2026-08', cash_end: 100, outflow_3m: 300, cash_days: 30 },
        { month: '2026-07', cash_end: 80, outflow_3m: null, cash_days: null },
      ],
    },
    cash_min: { daily: [], min_day: { day: '2026-08-12', balance: 3 } },
    ar90: {
      aging: [{ bucket: 'mas_90', amount: 10, invoices: 2 }],
      debtors: [
        { counterparty_id: 'COUNTERPARTY_1', open: 10, over_90: 10 },
        'garbage',
      ],
    },
    top_client: {
      customers: [
        { counterparty_id: 'COUNTERPARTY_2', billed_3m: 5, top: true },
        { counterparty_id: 'COUNTERPARTY_3', billed_3m: 4, top: 'yes' },
      ],
    },
    network: {
      customers: [
        {
          counterparty_id: 'COUNTERPARTY_9',
          billed_6m: 1000,
          share: 0.4,
          health: 0.9,
          health_d3: -0.1,
          n_companies: 1,
        },
      ],
      months: [{ month: '2026-08', exposure: 0.02, customers: 3 }],
    },
  },
};

describe('parsePulseCompanyDetails', () => {
  it('reads every block, empty where the export carried nothing', () => {
    const details = parsePulseCompanyDetails(PAYLOAD)!;
    expect(details.companyId).toBe('COMP_0001');
    expect(details.month).toBe('2026-08');
    const { variables } = details;
    expect(variables.cash_days.daily).toEqual([
      { day: '2026-08-30', balance: 100.5 },
      { day: '2026-08-31', balance: null },
    ]);
    expect(variables.cash_days.dailyOutflow).toBe(12.5);
    expect(variables.cash_days.accounts[0].bank).toBe('Banco Sabadell');
    expect(variables.cash_days.months.map((row) => row.month)).toEqual([
      '2026-07',
      '2026-08',
    ]);
    expect(variables.cash_days.months[1].values.cashDays).toBe(30);
    expect(variables.cash_days.months[0].values.outflow3m).toBeNull();
    expect(variables.cash_min.minDay).toEqual({
      day: '2026-08-12',
      balance: 3,
    });
    expect(variables.ar90.debtors).toHaveLength(1);
    expect(variables.ar90.debtors[0].shareOver90).toBeNull();
    expect(variables.top_client.customers.map((row) => row.top)).toEqual([
      true,
      false,
    ]);
    expect(variables.network.customers[0].healthD3).toBe(-0.1);
    expect(variables.network.months[0].values.customers).toBe(3);
    expect(variables.loc_util.lines).toEqual([]);
    expect(variables.dpo.suppliers).toEqual([]);
    expect(variables.maturities.products).toEqual([]);
    expect(variables.loc_accel.months).toEqual([]);
  });

  it('rejects a payload without company', () => {
    expect(parsePulseCompanyDetails({ month: '2026-08' })).toBeNull();
    expect(parsePulseCompanyDetails(null)).toBeNull();
  });
});

describe('row helpers', () => {
  it('converts keys and drops entries that are not objects', () => {
    expect(camelCase('over_90')).toBe('over90');
    expect(camelCase('service_3m')).toBe('service3m');
    expect(camelCase('month')).toBe('month');
    expect(parseRows([1, null, {}], NETWORK_CUSTOMER_SPEC)).toEqual([
      {
        counterpartyId: '',
        billed6m: null,
        share: null,
        health: null,
        healthD3: null,
        nCompanies: null,
      },
    ]);
    expect(parseMonths([{ exposure: 1 }, { month: '2026-01' }])).toEqual([
      { month: '2026-01', values: {} },
    ]);
  });
});

describe('counterpartyName', () => {
  it('is deterministic, readable and distinct for neighbouring ids', () => {
    const a = counterpartyName('COUNTERPARTY_47797');
    expect(a).toBe(counterpartyName('COUNTERPARTY_47797'));
    expect(a).not.toContain('COUNTERPARTY');
    expect(a).not.toBe(counterpartyName('COUNTERPARTY_47798'));
    expect(counterpartyName('')).toBe('');
  });
});

describe('ApiPulseSource.getCompanyDetails', () => {
  it('calls the details endpoint and parses the answer', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response(JSON.stringify(PAYLOAD), { status: 200 });
    }) as typeof fetch;
    const source = new ApiPulseSource('http://api.test', fetchImpl);
    const details = await source.getCompanyDetails('COMP_0001');
    expect(calls[0]).toBe(
      'http://api.test/api/pulse/companies/COMP_0001/details',
    );
    expect(details?.variables.network.customers).toHaveLength(1);
  });

  it('returns null on a 404', async () => {
    const fetchImpl = (async () =>
      new Response('', { status: 404 })) as typeof fetch;
    const source = new ApiPulseSource('http://api.test', fetchImpl);
    expect(await source.getCompanyDetails('COMP_9999')).toBeNull();
  });
});
