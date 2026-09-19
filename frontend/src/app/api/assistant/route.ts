import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from 'ai';
import { buildChart } from '@/lib/assistant/charts/build';
import {
  ASSISTANT_MAX_OUTPUT_TOKENS,
  ASSISTANT_MAX_STEPS,
  ASSISTANT_MODEL,
  ASSISTANT_PROVIDER_OPTIONS,
  ASSISTANT_TIMEOUT_MS,
  getAssistantMode,
} from '@/lib/assistant/config';
import {
  assistantToolContext,
  getAssistantContext,
} from '@/lib/assistant/context';
import { assistantInstructions } from '@/lib/assistant/instructions';
import { getMockChart, getMockReply } from '@/lib/assistant/mock';
import {
  AssistantRequestError,
  readAssistantRequest,
} from '@/lib/assistant/request';
import { mockStreamResponse, type MockReply } from '@/lib/assistant/stream';
import { createAssistantTools } from '@/lib/assistant/tools';
import { ToolRuntime } from '@/lib/assistant/tools/context';
import { messageText, type AssistantMetadata } from '@/lib/assistant/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** Accepts bounded history; streams mock or Gateway output, tools included, without exposing secrets. */
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
    const toolContext = assistantToolContext(context);
    if (mode === 'mock') {
      const chart = getMockChart(question, context);
      const reply: MockReply = { text: getMockReply(question, context) };
      if (chart) {
        const output = await buildChart(new ToolRuntime(toolContext), chart);
        reply.tools = [{ toolName: 'show_chart', input: chart, output }];
      }
      return mockStreamResponse(reply, metadata, request.signal);
    }
    const tools = createAssistantTools(toolContext);
    const result = streamText({
      model: ASSISTANT_MODEL,
      instructions: assistantInstructions(context),
      messages: await convertToModelMessages(messages, {
        tools,
        ignoreIncompleteToolCalls: true,
      }),
      tools,
      stopWhen: stepCountIs(ASSISTANT_MAX_STEPS),
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
        tools,
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
