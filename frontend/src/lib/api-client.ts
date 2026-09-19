/** Performs one GET against the X-Ray service and decodes the JSON body. */
export type JsonGetter = (pathname: string) => Promise<unknown>;

/**
 * Builds the HTTP reader used by {@link ApiSource}.
 *
 * Any transport error or non-2xx status resolves to `null` instead of throwing,
 * so a backend that is down degrades the page to an empty state rather than to
 * a server error during the demo.
 *
 * @param baseUrl - Root URL of the service; a trailing slash is ignored.
 * @param fetchImpl - Injected `fetch`, overridden in tests.
 * @returns A function that reads one path and returns the decoded body.
 */
export function createJsonGetter(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
): JsonGetter {
  const root = baseUrl.replace(/\/$/, '');
  return async (pathname: string) => {
    try {
      const response = await fetchImpl(`${root}${pathname}`, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  };
}
