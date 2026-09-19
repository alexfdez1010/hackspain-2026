'use client';

import { useEffect, useState } from 'react';

import { fetchCompanyActions } from '@/lib/actions/client';
import { readStoredActions, writeStoredActions } from '@/lib/actions/storage';
import type { CompanyActions } from '@/lib/actions/types';

/** What the block knows at each moment. */
export type CompanyActionsState =
  { status: 'loading' } | { status: 'ready'; result: CompanyActions | null };

/**
 * Gives a page the actions of a company, paying for the model only once per
 * browser and close.
 *
 * The browser copy is read first; when it is missing or belongs to an older
 * close, the server is asked and a model answer is kept for the next visit.
 * A server failure ends as «no data», never as an exception in the page.
 *
 * @param companyId - Company identifier.
 * @param month - Close the page shows, as `YYYY-MM`; a new close invalidates the copy.
 * @returns The current state of the actions.
 */
export function useCompanyActions(
  companyId: string,
  month: string,
): CompanyActionsState {
  const [state, setState] = useState<CompanyActionsState>({
    status: 'loading',
  });

  useEffect(() => {
    const stored = readStoredActions(window.localStorage, companyId, month);
    if (stored) {
      setState({ status: 'ready', result: stored });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchCompanyActions(companyId, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result) writeStoredActions(window.localStorage, result);
        setState({ status: 'ready', result });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error('[actions] request failed', error);
        setState({ status: 'ready', result: null });
      });
    return () => controller.abort();
  }, [companyId, month]);

  return state;
}
