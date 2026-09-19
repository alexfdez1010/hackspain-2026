import { isAssistantToolPartType } from '@/lib/assistant/tools/names';
import {
  MAX_HISTORY_MESSAGES,
  MAX_PROMPT_LENGTH,
  type AssistantMessage,
  type AssistantPart,
  type AssistantRequest,
} from '@/lib/assistant/types';

const MAX_BODY_BYTES = 262_144;
/** Parts a reply may carry: a step marker, a tool and a text per step. */
const MAX_PARTS = 32;
/** Serialised size of one tool part kept in the history. */
const MAX_TOOL_PART_CHARS = 12_000;
/** The routes the assistant may be told it is on; mirrors `VARIABLE_KEY_PATTERN`. */
const KNOWN_PATH =
  /^\/(?:company\/COMP_\d{4}(?:\/recommendations|\/signals|\/diagnosis|\/detail|\/variable\/[a-z][a-z0-9_]{0,31})?|method)?$/;

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

/**
 * Keeps a finished tool call of a past reply, so the model remembers what it
 * read; anything unfinished, unknown or oversized is dropped, never trusted.
 *
 * @param part - Untrusted part of an assistant message.
 * @returns The part to keep, or `null` to drop it.
 */
function toolPart(part: Record<string, unknown>): AssistantPart | null {
  if (
    typeof part.type !== 'string' ||
    !isAssistantToolPartType(part.type) ||
    part.state !== 'output-available' ||
    typeof part.toolCallId !== 'string' ||
    !part.toolCallId ||
    part.toolCallId.length > 128 ||
    !isRecord(part.input) ||
    part.output === undefined
  )
    return null;
  const kept = {
    type: part.type,
    toolCallId: part.toolCallId,
    state: 'output-available' as const,
    input: part.input,
    output: part.output,
  };
  if (JSON.stringify(kept).length > MAX_TOOL_PART_CHARS) return null;
  return kept as unknown as AssistantPart;
}

/** Validates bounded history and strips client metadata and system prompts. */
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
      entry.parts.length > MAX_PARTS
    ) {
      throw new AssistantRequestError('El mensaje no es válido.');
    }
    ids.add(entry.id);
    const assistant = entry.role === 'assistant';
    const parts: AssistantPart[] = [];
    let text = '';
    for (const part of entry.parts) {
      if (!isRecord(part))
        throw new AssistantRequestError('El mensaje debe contener texto.');
      if (assistant && part.type === 'step-start') continue;
      if (
        assistant &&
        typeof part.type === 'string' &&
        part.type.startsWith('tool-')
      ) {
        const kept = toolPart(part);
        if (kept) parts.push(kept);
        continue;
      }
      if (part.type !== 'text' || typeof part.text !== 'string')
        throw new AssistantRequestError('Solo se admiten mensajes de texto.');
      text += part.text;
    }
    const limit = assistant ? 12_000 : MAX_PROMPT_LENGTH;
    if (text.length > limit || (!assistant && !text.trim()))
      throw new AssistantRequestError(
        'El mensaje está vacío o es demasiado largo.',
      );
    if (text.trim()) parts.push({ type: 'text', text: text.trim() });
    if (parts.length === 0)
      throw new AssistantRequestError(
        'El mensaje está vacío o es demasiado largo.',
      );
    return { id: entry.id, role: entry.role as 'user' | 'assistant', parts };
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
