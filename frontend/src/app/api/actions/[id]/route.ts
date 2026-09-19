import { getCompanyActions } from '@/lib/actions/service';
import type { CompanyActions } from '@/lib/actions/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Loader of the actions; the handler takes it as a parameter for tests. */
export type ActionsLoader = (
  companyId: string,
) => Promise<CompanyActions | null>;

/**
 * Writes the response of the actions route from a loaded result.
 *
 * The browser keeps its own copy per company and close, so the HTTP layer
 * never caches: a fresh close must reach the page the moment it exists.
 *
 * @param result - Actions of the company, or `null` when it is unknown.
 * @returns The JSON response.
 */
export function actionsResponse(result: CompanyActions | null): Response {
  if (!result) {
    return Response.json(
      { error: 'Empresa desconocida' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Returns the actions of one company as JSON, in the same shape the pages
 * read; the model call, its memo and the demo fallback live in the service.
 *
 * @param _request - Incoming request; unused.
 * @param context - Route parameters carrying the company identifier.
 * @returns The actions, or a 404 when the identifier is unknown.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  return handleActionsRequest(id, getCompanyActions);
}

/**
 * The route without Next.js: loads and answers, never throws.
 *
 * @param companyId - Company identifier.
 * @param load - Loader of the actions.
 * @returns The response.
 */
export async function handleActionsRequest(
  companyId: string,
  load: ActionsLoader,
): Promise<Response> {
  try {
    return actionsResponse(await load(companyId));
  } catch (error) {
    console.error('[actions] route failed', error);
    return Response.json(
      { error: 'No he podido escribir las acciones. Inténtalo de nuevo.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
