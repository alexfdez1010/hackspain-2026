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

/** A tool call the demo replays: the model's input and the real output. */
export interface MockToolCall {
  toolName: string;
  input: unknown;
  output: unknown;
}

/** What the demo streams: optional tool calls first, then the prose. */
export interface MockReply {
  text: string;
  tools?: MockToolCall[];
}

/**
 * Streams a deterministic mock through the exact SDK protocol used by the
 * Gateway, tool parts included, so the browser renders a demo chart with
 * the same code path as a real one.
 *
 * @param reply - Text and tool calls to replay.
 * @param metadata - Mode and sources attached to the message.
 * @param signal - Aborts the stream when the browser cancels.
 * @returns The SSE response.
 */
export function mockStreamResponse(
  reply: MockReply,
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
        for (const [index, call] of (reply.tools ?? []).entries()) {
          const toolCallId = `mock-${index}`;
          writer.write({ type: 'start-step' });
          writer.write({
            type: 'tool-input-start',
            toolCallId,
            toolName: call.toolName,
          });
          writer.write({
            type: 'tool-input-available',
            toolCallId,
            toolName: call.toolName,
            input: call.input,
          });
          await setTimeout(350, undefined, { signal });
          writer.write({
            type: 'tool-output-available',
            toolCallId,
            output: call.output,
          });
          writer.write({ type: 'finish-step' });
        }
        writer.write({ type: 'start-step' });
        writer.write({ type: 'text-start', id: 'answer' });
        for (const delta of reply.text.match(/[\s\S]{1,18}/g) ?? []) {
          signal.throwIfAborted();
          writer.write({ type: 'text-delta', id: 'answer', delta });
          await setTimeout(24, undefined, { signal });
        }
        writer.write({ type: 'text-end', id: 'answer' });
        writer.write({ type: 'finish-step' });
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
