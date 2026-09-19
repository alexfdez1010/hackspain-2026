import { describe, expect, it, vi } from 'vitest';

import { handleActionsRequest } from '@/app/api/actions/[id]/route';
import type { CompanyActions } from '@/lib/actions/types';

const RESULT: CompanyActions = {
  companyId: 'COMP_0001',
  month: '2026-08',
  mode: 'gateway',
  actions: [{ title: 'Cobra la factura', detail: 'Hoy.', target: 'pulse' }],
};

describe('GET /api/actions/[id]', () => {
  it('answers the actions as JSON without letting HTTP cache them', async () => {
    const response = await handleActionsRequest(
      'COMP_0001',
      async () => RESULT,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual(RESULT);
  });

  it('gives a 404 for a company the service does not know', async () => {
    const response = await handleActionsRequest('NOPE', async () => null);
    expect(response.status).toBe(404);
  });

  it('turns a service failure into a 503, never a thrown error', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await handleActionsRequest('COMP_0001', async () => {
      throw new Error('boom');
    });
    expect(response.status).toBe(503);
    error.mockRestore();
  });
});
