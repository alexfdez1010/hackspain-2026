import type { CompanyActions } from '@/lib/actions/types';

/** Route the browser asks for the actions of one company. */
export function actionsApiPath(companyId: string): string {
  return `/api/actions/${encodeURIComponent(companyId)}`;
}

/** Signature of `fetch`, so tests can hand in a fake. */
export type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal },
) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>;

/**
 * Asks the server for the actions of a company.
 *
 * @param companyId - Company identifier.
 * @param options - Abort signal and the fetch to use.
 * @returns The actions, or `null` when the company is unknown.
 * @throws When the server fails or the response is not JSON.
 */
export async function fetchCompanyActions(
  companyId: string,
  options: { signal?: AbortSignal; fetchImpl?: FetchLike } = {},
): Promise<CompanyActions | null> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(actionsApiPath(companyId), {
    signal: options.signal,
  });
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`actions request failed: ${response.status}`);
  return (await response.json()) as CompanyActions;
}
