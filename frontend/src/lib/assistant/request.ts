import {
  MAX_HISTORY_MESSAGES,
  MAX_PROMPT_LENGTH,
  type AssistantMessage,
  type AssistantRequest,
} from '@/lib/assistant/types';

const MAX_BODY_BYTES = 65_536;
const KNOWN_PATH =
  /^\/(?:pulse(?:\/COMP_\d{4})?|empresa\/COMP_\d{4}|capital|monitor|metodo)?$/;

/** A safe public error; no provider details are exposed to the client. */
export class AssistantRequestError extends Error {
  /** Stores the public message and HTTP status; defaults to invalid input. */
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/** Narrows untrusted JSON to a record without coercion. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validates bounded, text-only history and strips client metadata and system prompts. */
export function parseAssistantRequest(value: unknown): AssistantRequest {
  if (
    !isRecord(value) ||
    !Array.isArray(value.messages) ||
    !value.messages.length ||
    value.messages.length > MAX_HISTORY_MESSAGES
  ) {
    throw new AssistantRequestError(
      'La conversación no es válida. Empieza una nueva.',
    );
  }
  const ids = new Set<string>();
  const messages = value.messages.map((entry): AssistantMessage => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      !entry.id ||
      entry.id.length > 128 ||
      ids.has(entry.id) ||
      !['user', 'assistant'].includes(String(entry.role)) ||
      !Array.isArray(entry.parts) ||
      entry.parts.length > 8
    ) {
      throw new AssistantRequestError('El mensaje no es válido.');
    }
    ids.add(entry.id);
    let text = '';
    for (const part of entry.parts) {
      if (!isRecord(part))
        throw new AssistantRequestError('El mensaje debe contener texto.');
      if (part.type === 'step-start' && entry.role === 'assistant') continue;
      if (part.type !== 'text' || typeof part.text !== 'string')
        throw new AssistantRequestError('Solo se admiten mensajes de texto.');
      text += part.text;
    }
    const limit = entry.role === 'user' ? MAX_PROMPT_LENGTH : 12_000;
    if (!text.trim() || text.length > limit)
      throw new AssistantRequestError(
        'El mensaje está vacío o es demasiado largo.',
      );
    return {
      id: entry.id,
      role: entry.role as 'user' | 'assistant',
      parts: [{ type: 'text', text: text.trim() }],
    };
  });
  if (messages.at(-1)?.role !== 'user')
    throw new AssistantRequestError('Falta la pregunta.');
  return {
    messages,
    pathname:
      typeof value.pathname === 'string' && KNOWN_PATH.test(value.pathname)
        ? value.pathname
        : '/',
  };
}

/** Reads JSON incrementally with a hard byte cap; rejects cross-origin browser requests. */
export async function readAssistantRequest(
  request: Request,
): Promise<AssistantRequest> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    throw new AssistantRequestError('Origen no permitido.', 403);
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new AssistantRequestError('Se requiere JSON.', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new AssistantRequestError('Falta la pregunta.');
  const decoder = new TextDecoder();
  let body = '';
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new AssistantRequestError(
          'La conversación es demasiado larga.',
          413,
        );
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  try {
    return parseAssistantRequest(JSON.parse(body));
  } catch (error) {
    if (error instanceof AssistantRequestError) throw error;
    throw new AssistantRequestError('El JSON no es válido.');
  }
}
