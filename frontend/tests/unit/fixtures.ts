import type { Company, Pillars } from '@/lib/xray/types';

/** Pillars with no evidence, used as the default of the test fixtures. */
export const EMPTY_PILLARS: Pillars = {
  liquidity: null,
  cashflow: null,
  payments: null,
  receivables: null,
  debt: null,
  activity: null,
};

/**
 * Builds a company with sensible defaults for selector and derivation tests.
 *
 * @param overrides - Fields to override.
 * @returns A complete company without series.
 */
export function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    company_id: 'COMP_0001',
    group_id: 'GROUP_0001',
    months_observed: 24,
    score: 60,
    score_prev: 58,
    score_6m_ago: 50,
    trend_6m: 1.5,
    direction: 'improving',
    regime: 'steady',
    p_stress: 0.2,
    pillars: { ...EMPTY_PILLARS },
    reasons: [],
    ...overrides,
  };
}
