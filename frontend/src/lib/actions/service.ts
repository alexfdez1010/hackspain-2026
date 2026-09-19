import { buildActionContext } from '@/lib/actions/context';
import { fallbackActions } from '@/lib/actions/fallback';
import { generateActions, type ActionsGenerator } from '@/lib/actions/generate';
import type { ActionsMode, CompanyActions } from '@/lib/actions/types';
import {
  getAdvisorDataSource,
  type AdvisorDataSource,
} from '@/lib/advisor/data';
import { getAssistantMode } from '@/lib/assistant/config';
import { getPulseDataSource, type PulseDataSource } from '@/lib/pulse/data';

/** How long the actions of one close stay in memory; a new close changes the key anyway. */
export const ACTIONS_CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  expires: number;
  value: Promise<CompanyActions>;
}

/** One entry per company, close and mode; shared by every page of the process. */
const cache = new Map<string, CacheEntry>();

/** Everything the service reads; injected in tests, real by default. */
export interface ActionsDeps {
  pulse: Pick<PulseDataSource, 'getSummary' | 'getCompany'>;
  advisor: Pick<AdvisorDataSource, 'getCompany'>;
  generate: ActionsGenerator;
  mode: ActionsMode;
  now: () => number;
}

function defaultDeps(): ActionsDeps {
  return {
    pulse: getPulseDataSource(),
    advisor: getAdvisorDataSource(),
    generate: generateActions,
    mode: getAssistantMode(),
    now: Date.now,
  };
}

/**
 * Writes the actions of a company: from the model in gateway mode, from the
 * deterministic builder in demo mode or when the model gives nothing usable.
 *
 * @param companyId - Company identifier.
 * @param deps - Data sources, generator, mode and clock.
 * @returns The actions, or `null` when the company is unknown.
 */
async function writeActions(
  companyId: string,
  deps: ActionsDeps,
): Promise<CompanyActions | null> {
  const [summary, company, advisor] = await Promise.all([
    deps.pulse.getSummary(),
    deps.pulse.getCompany(companyId),
    deps.advisor.getCompany(companyId),
  ]);
  if (!company) return null;
  const context = buildActionContext(company, summary.meta, advisor);
  const keys = summary.meta.variables.map((variable) => variable.key);
  const base = { companyId, month: company.month };
  if (deps.mode === 'mock')
    return { ...base, mode: 'mock', actions: fallbackActions(context) };
  try {
    const actions = await deps.generate(context, keys);
    if (actions.length > 0) return { ...base, mode: 'gateway', actions };
  } catch (error) {
    console.error('[actions] model call failed', error);
  }
  return { ...base, mode: 'mock', actions: fallbackActions(context) };
}

/**
 * Returns the actions of a company, memoised per close so navigating between
 * the pages of a company never pays for a second model call.
 *
 * @param companyId - Company identifier.
 * @param overrides - Dependencies to replace, for tests.
 * @returns The actions, or `null` when the company is unknown.
 */
export async function getCompanyActions(
  companyId: string,
  overrides: Partial<ActionsDeps> = {},
): Promise<CompanyActions | null> {
  const deps = { ...defaultDeps(), ...overrides };
  const key = `${deps.mode}|${companyId}`;
  const hit = cache.get(key);
  if (hit && hit.expires > deps.now()) {
    const cached = await hit.value;
    return cached;
  }
  const value = writeActions(companyId, deps).then((result) => {
    if (!result) throw new Error(`unknown company ${companyId}`);
    return result;
  });
  cache.set(key, { expires: deps.now() + ACTIONS_CACHE_TTL_MS, value });
  try {
    return await value;
  } catch {
    cache.delete(key);
    return null;
  }
}

/** Empties the memo; tests call it between cases. */
export function clearActionsCache(): void {
  cache.clear();
}
