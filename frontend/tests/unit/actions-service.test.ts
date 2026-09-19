import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ActionsGenerator } from '@/lib/actions/generate';
import {
  clearActionsCache,
  getCompanyActions,
  type ActionsDeps,
} from '@/lib/actions/service';
import type { CompanyAction } from '@/lib/actions/types';
import { getAdvisorDataSource } from '@/lib/advisor/data';
import { getPulseDataSource } from '@/lib/pulse/data';

/** What a healthy model call gives back. */
const WRITTEN: CompanyAction[] = [
  {
    title: 'Renegocia la línea antes del 30 de septiembre',
    detail: 'El diferencial bajaría 120 pb con los días de caja de agosto.',
    target: 'advisor',
  },
];

/**
 * Builds the dependencies with the bundled export behind them, so only the
 * model call and the mode change between cases.
 *
 * @param generate - Model call under test.
 * @param mode - Whether the page may call the model at all.
 * @returns The dependencies the service is called with.
 */
function deps(
  generate: ActionsGenerator,
  mode: 'mock' | 'gateway',
): Partial<ActionsDeps> {
  return {
    pulse: getPulseDataSource(),
    advisor: getAdvisorDataSource(),
    generate,
    mode,
    now: () => 1_000,
  };
}

beforeEach(() => {
  clearActionsCache();
});

describe('getCompanyActions', () => {
  it('never calls the model in demo mode and still answers', async () => {
    const generate = vi.fn<ActionsGenerator>(async () => WRITTEN);
    const result = await getCompanyActions('COMP_0001', deps(generate, 'mock'));
    expect(generate).not.toHaveBeenCalled();
    expect(result?.mode).toBe('mock');
    expect(result?.month).toBe('2026-08');
    expect(result?.actions.length).toBeGreaterThan(0);
    expect(result?.actions.length).toBeLessThanOrEqual(3);
  });

  it('shows what the model wrote when the gateway answers', async () => {
    const generate = vi.fn<ActionsGenerator>(async () => WRITTEN);
    const result = await getCompanyActions(
      'COMP_0001',
      deps(generate, 'gateway'),
    );
    expect(generate).toHaveBeenCalledTimes(1);
    expect(result?.mode).toBe('gateway');
    expect(result?.actions).toEqual(WRITTEN);
  });

  it('falls back to the deterministic actions when the model fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const generate = vi.fn<ActionsGenerator>(async () => {
      throw new Error('gateway down');
    });
    const result = await getCompanyActions(
      'COMP_0001',
      deps(generate, 'gateway'),
    );
    expect(result?.mode).toBe('mock');
    expect(result?.actions.length).toBeGreaterThan(0);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it('falls back when the model answers with nothing usable', async () => {
    const generate = vi.fn<ActionsGenerator>(async () => []);
    const result = await getCompanyActions(
      'COMP_0001',
      deps(generate, 'gateway'),
    );
    expect(generate).toHaveBeenCalledTimes(1);
    expect(result?.mode).toBe('mock');
    expect(result?.actions.length).toBeGreaterThan(0);
  });

  it('pays for one model call per company and close', async () => {
    const generate = vi.fn<ActionsGenerator>(async () => WRITTEN);
    const first = await getCompanyActions(
      'COMP_0001',
      deps(generate, 'gateway'),
    );
    const second = await getCompanyActions(
      'COMP_0001',
      deps(generate, 'gateway'),
    );
    expect(generate).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('knows nothing about a company that is not in the export', async () => {
    const generate = vi.fn<ActionsGenerator>(async () => WRITTEN);
    const result = await getCompanyActions('COMP_9999', deps(generate, 'mock'));
    expect(result).toBeNull();
  });
});
