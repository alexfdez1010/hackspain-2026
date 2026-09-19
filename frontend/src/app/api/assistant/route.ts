import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from 'ai';
import {
  ASSISTANT_MAX_OUTPUT_TOKENS,
  ASSISTANT_MODEL,
  ASSISTANT_PROVIDER_OPTIONS,
  ASSISTANT_TIMEOUT_MS,
  getAssistantMode,
} from '@/lib/assistant/config';
import {
  assistantInstructions,
  getAssistantContext,
} from '@/lib/assistant/context';
import { getMockReply } from '@/lib/assistant/mock';
import {
  AssistantRequestError,
  readAssistantRequest,
} from '@/lib/assistant/request';
import { mockStreamResponse } from '@/lib/assistant/stream';
import { messageText, type AssistantMetadata } from '@/lib/assistant/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Accepts bounded text history; streams mock or Gateway output without exposing secrets. */
export async function POST(request: Request): Promise<Response> {
  try {
    const { messages, pathname } = await readAssistantRequest(request);
    const mode = getAssistantMode();
    if (mode === 'gateway' && !process.env.AI_GATEWAY_API_KEY?.trim()) {
      return Response.json(
        { error: 'El asistente no está configurado. Inténtalo más tarde.' },
        { status: 503 },
      );
    }
    const question = messageText(messages.at(-1)!);
    const context = await getAssistantContext(pathname, question);
    const metadata: AssistantMetadata = { mode, sources: context.sources };
    if (mode === 'mock')
      return mockStreamResponse(
        getMockReply(question, context),
        metadata,
        request.signal,
      );
    const result = streamText({
      model: ASSISTANT_MODEL,
      instructions: assistantInstructions(context),
      messages: await convertToModelMessages(messages),
      providerOptions: ASSISTANT_PROVIDER_OPTIONS,
      abortSignal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(ASSISTANT_TIMEOUT_MS),
      ]),
      maxOutputTokens: ASSISTANT_MAX_OUTPUT_TOKENS,
      maxRetries: 2,
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        sendReasoning: false,
        messageMetadata: ({ part }): AssistantMetadata | undefined =>
          part.type === 'start'
            ? metadata
            : part.type === 'finish'
              ? { ...metadata, finishReason: part.finishReason }
              : undefined,
        onError: () =>
          'No he podido conectar con el modelo. Vuelve a intentarlo.',
      }),
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof AssistantRequestError)
      return Response.json({ error: error.message }, { status: error.status });
    return Response.json(
      { error: 'No he podido consultar los datos. Inténtalo de nuevo.' },
      { status: 503 },
    );
  }
}
