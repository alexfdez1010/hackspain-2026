import type { ActionTarget } from '@/lib/actions/types';
import {
  companyRoutes,
  companyVariableRoute,
  VARIABLE_KEY_PATTERN,
  type CompanySection,
} from '@/lib/routes';

/** A verified internal link for one action. */
export interface ActionLink {
  href: string;
  /** What the link leads to, never where it is. */
  label: string;
}

/** Labels of the fixed targets. */
const TARGET_LABELS: Record<
  Exclude<ActionTarget, `variable:${string}`>,
  string
> = {
  advisor: 'Ver el producto',
  signals: 'Ver la señal',
  pulse: 'Ver el PULSE',
  method: 'Cómo se calcula',
};

/**
 * Turns a target written by the model into a target the app can route.
 *
 * Unknown targets and variable keys outside the score fall back to the
 * recommendations page, so a hallucinated route never reaches the page.
 *
 * @param raw - Target string from the model or the fallback.
 * @param variableKeys - Keys of the eleven variables of the score.
 * @returns A safe target.
 */
export function normaliseTarget(
  raw: string,
  variableKeys: readonly string[],
): ActionTarget {
  const value = raw.trim();
  if (value === 'advisor' || value === 'signals' || value === 'method')
    return value;
  if (value === 'pulse') return 'pulse';
  const match = /^variable:([a-z0-9_]+)$/.exec(value);
  if (match && VARIABLE_KEY_PATTERN.test(match[1])) {
    if (variableKeys.includes(match[1])) return `variable:${match[1]}`;
  }
  return 'advisor';
}

/**
 * Builds the link of an action, or none when it would point at the page the
 * reader is already on.
 *
 * @param target - Safe target of the action.
 * @param companyId - Company in context.
 * @param current - Section the reader is on.
 * @returns The link, or `null` when the action executes on this page.
 */
export function actionLink(
  target: ActionTarget,
  companyId: string,
  current: CompanySection,
): ActionLink | null {
  const routes = companyRoutes(companyId);
  if (target.startsWith('variable:')) {
    const key = target.slice('variable:'.length);
    return {
      href: companyVariableRoute(companyId, key),
      label: 'Ver la variable',
    };
  }
  const fixed = target as Exclude<ActionTarget, `variable:${string}`>;
  if (fixed === current) return null;
  return { href: routes[fixed], label: TARGET_LABELS[fixed] };
}
