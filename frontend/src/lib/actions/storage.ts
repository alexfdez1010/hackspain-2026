import { z } from 'zod';

import { MAX_ACTIONS, type CompanyActions } from '@/lib/actions/types';

/** Prefix of every key; the version changes when the stored shape does. */
export const ACTIONS_STORAGE_PREFIX = 'embat-pulse.actions.v1:';

/** The part of `Storage` the cache uses; `localStorage` satisfies it. */
export type ActionsStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Shape a stored entry must have to be trusted; anything else is ignored. */
const storedActionsSchema = z.object({
  companyId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  mode: z.literal('gateway'),
  actions: z
    .array(
      z.object({
        title: z.string().min(1),
        detail: z.string(),
        target: z.string().min(1),
      }),
    )
    .max(MAX_ACTIONS),
});

/**
 * Key under which the actions of one company live in the browser.
 *
 * @param companyId - Company identifier.
 * @returns The storage key.
 */
export function actionsStorageKey(companyId: string): string {
  return `${ACTIONS_STORAGE_PREFIX}${companyId}`;
}

/**
 * Reads the actions the browser already holds for a company, if they were
 * written by the model for the close the page is showing.
 *
 * A stale close, a demo answer, a malformed entry or a storage that throws
 * all read as a miss; the caller then asks the server.
 *
 * @param storage - Browser storage, or a stand-in in tests.
 * @param companyId - Company identifier.
 * @param month - Close the page shows, as `YYYY-MM`.
 * @returns The stored actions, or `null` on a miss.
 */
export function readStoredActions(
  storage: ActionsStorage,
  companyId: string,
  month: string,
): CompanyActions | null {
  try {
    const raw = storage.getItem(actionsStorageKey(companyId));
    if (!raw) return null;
    const parsed = storedActionsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const entry = parsed.data;
    if (entry.companyId !== companyId || entry.month !== month) return null;
    return entry as CompanyActions;
  } catch {
    return null;
  }
}

/**
 * Keeps the actions the model wrote so the next visit never pays for them
 * again. Demo answers are not kept: they cost nothing and must disappear the
 * moment a model is configured.
 *
 * @param storage - Browser storage, or a stand-in in tests.
 * @param result - Actions of the company for one close.
 * @returns `true` when the entry was written.
 */
export function writeStoredActions(
  storage: ActionsStorage,
  result: CompanyActions,
): boolean {
  if (result.mode !== 'gateway') return false;
  try {
    storage.setItem(
      actionsStorageKey(result.companyId),
      JSON.stringify(result),
    );
    return true;
  } catch {
    return false;
  }
}
