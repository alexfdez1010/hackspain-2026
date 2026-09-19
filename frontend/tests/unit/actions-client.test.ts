import { describe, expect, it, vi } from 'vitest';

import {
  actionsApiPath,
  fetchCompanyActions,
  type FetchLike,
} from '@/lib/actions/client';
import type { CompanyActions } from '@/lib/actions/types';

const RESULT: CompanyActions = {
  companyId: 'COMP_0001',
  month: '2026-08',
  mode: 'gateway',
  actions: [],
};

/** Fake fetch answering with the given status and body. */
function reply(status: number, body: unknown): FetchLike {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe('fetchCompanyActions', () => {
  it('asks the actions route of the company, encoded', () => {
    expect(actionsApiPath('COMP_0001')).toBe('/api/actions/COMP_0001');
    expect(actionsApiPath('a/b')).toBe('/api/actions/a%2Fb');
  });

  it('returns the actions the server wrote', async () => {
    const fetchImpl = vi.fn(reply(200, RESULT));
    const result = await fetchCompanyActions('COMP_0001', { fetchImpl });
    expect(result).toEqual(RESULT);
    expect(fetchImpl).toHaveBeenCalledWith('/api/actions/COMP_0001', {
      signal: undefined,
    });
  });

  it('reads an unknown company as null and a failure as an error', async () => {
    expect(
      await fetchCompanyActions('NOPE', { fetchImpl: reply(404, {}) }),
    ).toBeNull();
    await expect(
      fetchCompanyActions('COMP_0001', { fetchImpl: reply(503, {}) }),
    ).rejects.toThrow('503');
  });
});
