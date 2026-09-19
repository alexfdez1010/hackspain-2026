import { describe, expect, it } from 'vitest';

import { buildActionContext } from '@/lib/actions/context';
import { generateActions } from '@/lib/actions/generate';
import { MAX_ACTIONS } from '@/lib/actions/types';
import { StaticAdvisorSource } from '@/lib/advisor/source/static-json';
import { getPulseDataSource } from '@/lib/pulse/data';

const hasKey = Boolean(process.env.AI_GATEWAY_API_KEY?.trim());

/**
 * Talks to the real Gateway model, so it only runs with a key in the
 * environment; the deterministic path is covered by the unit tests.
 */
describe.runIf(hasKey)('the actions model call', () => {
  it('writes at most three specific actions for COMP_0001', async () => {
    const pulse = getPulseDataSource();
    const [summary, company, advisor] = await Promise.all([
      pulse.getSummary(),
      pulse.getCompany('COMP_0001'),
      new StaticAdvisorSource().getCompany('COMP_0001'),
    ]);
    if (!company) throw new Error('missing COMP_0001');
    const context = buildActionContext(company, summary.meta, advisor);
    const keys = summary.meta.variables.map((variable) => variable.key);
    const actions = await generateActions(context, keys);
    console.info(JSON.stringify(actions, null, 2));
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(MAX_ACTIONS);
    for (const action of actions) {
      expect(action.title.length).toBeGreaterThan(10);
      expect(action.detail.length).toBeGreaterThan(10);
    }
  }, 60_000);
});
