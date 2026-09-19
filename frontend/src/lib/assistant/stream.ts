import { setTimeout } from 'node:timers/promises';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessageChunk,
} from 'ai';
import type {
  AssistantMetadata,
  AssistantMessage,
} from '@/lib/assistant/types';

/** Streams a deterministic mock through the exact SDK protocol used by the Gateway. */
export function mockStreamResponse(
  text: string,
  metadata: AssistantMetadata,
  signal: AbortSignal,
): Response {
  const stream = createUIMessageStream<AssistantMessage>({
    execute: async ({ writer }) => {
      writer.write({
        type: 'start',
        messageId: crypto.randomUUID(),
        messageMetadata: metadata,
      });
      try {
        await setTimeout(450, undefined, { signal });
        writer.write({ type: 'text-start', id: 'answer' });
        for (const delta of text.match(/[\s\S]{1,18}/g) ?? []) {
          signal.throwIfAborted();
          writer.write({ type: 'text-delta', id: 'answer', delta });
          await setTimeout(24, undefined, { signal });
        }
        writer.write({ type: 'text-end', id: 'answer' });
        writer.write({ type: 'finish', finishReason: 'stop' });
      } catch (error) {
        if (!signal.aborted) throw error;
        writer.write({ type: 'abort' } satisfies UIMessageChunk);
      }
    },
    onError: () => 'No he podido completar la respuesta. Inténtalo de nuevo.',
  });
  return createUIMessageStreamResponse({
    stream,
    headers: { 'Cache-Control': 'no-store' },
  });
}
