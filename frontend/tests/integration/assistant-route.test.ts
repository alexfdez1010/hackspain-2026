import { afterEach, describe, expect, it, vi } from 'vitest';
import { streamText, type TextStreamPart, type ToolSet } from 'ai';
import { POST } from '@/app/api/assistant/route';
import { getAssistantContext } from '@/lib/assistant/context';

vi.mock('ai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ai')>()),
  streamText: vi.fn(),
}));
vi.mock('@/lib/assistant/context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/assistant/context')>()),
  getAssistantContext: vi.fn(),
}));

const context = {
  page: 'Elegir empresa',
  provenance: 'Dataset local PULSE',
  companyId: undefined,
  month: '2026-08',
  scoreName: 'PULSE',
  horizons: [1, 6],
  pillars: [],
  variables: [],
  company: null,
  advisor: null,
  sources: [{ label: 'Método', href: '/method' }],
};

/** A company page context; the chart tool reads the bundled export of COMP_0001. */
const companyContext = {
  ...context,
  companyId: 'COMP_0001',
  page: 'PULSE · Atresmedia Labs',
  company: {
    id: 'COMP_0001',
    name: 'Atresmedia Labs',
    month: '2026-08',
    firstMonth: '2026-01',
    monthsObserved: 8,
    pulse: 45.6,
    pulsePrev: 38.1,
    change: 7.5,
    confidence: 0.82,
    pillars: {},
    unknownVariables: [],
    forecast: [],
    signals: [],
    activeSignal: null,
  },
};

/** Builds a valid in-process HTTP request without an external service or API key. */
function request(text = 'Hola', signal?: AbortSignal, pathname = '/') {
  return new Request('http://localhost/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pathname,
      messages: [{ id: 'u-1', role: 'user', parts: [{ type: 'text', text }] }],
    }),
    signal,
  });
}

/** Parses the SSE events of a response body. */
function events(body: string): Record<string, unknown>[] {
  return body
    .split('\n')
    .filter((line) => line.startsWith('data: {'))
    .map((line) => JSON.parse(line.slice(6)));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('assistant streaming endpoint', () => {
  it('streams an honest demo using the production UI protocol without calling a provider', async () => {
    vi.stubEnv('ASSISTANT_MODE', 'mock');
    vi.mocked(getAssistantContext).mockResolvedValue(context);
    const response = await POST(request('¿Qué es la IA?'));
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    const events = await response.text();
    expect(events).toContain('"mode":"mock"');
    expect(events).toContain('"type":"text-delta"');
    expect(events).toContain('"type":"finish"');
    expect(events).toContain('[DONE]');
    const text = events
      .split('\n')
      .filter((line) => line.startsWith('data: {'))
      .map((line) => JSON.parse(line.slice(6)))
      .filter((event) => event.type === 'text-delta')
      .map((event) => event.delta)
      .join('');
    expect(text).toContain('modelo de lenguaje');
    expect(streamText).not.toHaveBeenCalled();
  });
  it('rejects gateway mode without a key and never silently returns a mock', async () => {
    vi.stubEnv('ASSISTANT_MODE', 'gateway');
    vi.stubEnv('AI_GATEWAY_API_KEY', '');
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(getAssistantContext).not.toHaveBeenCalled();
  });
  it('passes the fixed Gemini model, low thinking, bounded tokens and abort signal to AI SDK', async () => {
    vi.stubEnv('ASSISTANT_MODE', 'gateway');
    vi.stubEnv('AI_GATEWAY_API_KEY', 'not-a-real-key');
    vi.mocked(getAssistantContext).mockResolvedValue(context);
    const chunks = [
      { type: 'start' },
      { type: 'text-start', id: 't' },
      { type: 'text-delta', id: 't', text: 'Respuesta de prueba' },
      { type: 'text-end', id: 't' },
      { type: 'finish', finishReason: 'length' },
    ] as unknown as TextStreamPart<ToolSet>[];
    vi.mocked(streamText).mockReturnValue({
      stream: new ReadableStream<TextStreamPart<ToolSet>>({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(chunk);
          controller.close();
        },
      }),
    } as ReturnType<typeof streamText>);
    const response = await POST(request());
    const events = await response.text();
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'google/gemini-3.8-flash',
        instructions: expect.stringContaining('show_chart'),
        maxOutputTokens: 10000,
        providerOptions: {
          google: { thinkingConfig: { thinkingLevel: 'low' } },
        },
        abortSignal: expect.any(AbortSignal),
        stopWhen: expect.any(Function),
        tools: expect.objectContaining({
          get_history: expect.anything(),
          get_month: expect.anything(),
          get_forecast: expect.anything(),
          get_signals: expect.anything(),
          get_financing: expect.anything(),
          get_variable: expect.anything(),
          get_variable_detail: expect.anything(),
          show_chart: expect.anything(),
        }),
      }),
    );
    expect(events).toContain('"mode":"gateway"');
    expect(events).toContain('"finishReason":"length"');
    expect(events).toContain('Respuesta de prueba');
    expect(events).not.toContain('not-a-real-key');
  });
  it('replays a real chart through the tool protocol in demo mode', async () => {
    vi.stubEnv('ASSISTANT_MODE', 'mock');
    vi.mocked(getAssistantContext).mockResolvedValue(companyContext);
    const response = await POST(
      request(
        'Dibuja la trayectoria del PULSE',
        undefined,
        '/company/COMP_0001',
      ),
    );
    const parsed = events(await response.text());
    const types = parsed.map((event) => event.type);
    expect(types).toContain('tool-input-available');
    expect(types).toContain('tool-output-available');
    expect(types.indexOf('tool-output-available')).toBeLessThan(
      types.indexOf('text-start'),
    );
    const output = parsed.find(
      (event) => event.type === 'tool-output-available',
    )?.output as { kind: string; company: string; points: unknown[] };
    expect(output.kind).toBe('trayectoria');
    expect(output.company).toBe('Atresmedia Labs');
    expect(output.points.length).toBeGreaterThan(6);
    expect(streamText).not.toHaveBeenCalled();
  });
  it('does not expose exceptions from the data service', async () => {
    vi.stubEnv('ASSISTANT_MODE', 'mock');
    vi.mocked(getAssistantContext).mockRejectedValue(
      new Error('private connection credentials'),
    );
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
  });
  it('terminates a cancelled mock without emitting a completed answer', async () => {
    vi.stubEnv('ASSISTANT_MODE', 'mock');
    vi.mocked(getAssistantContext).mockResolvedValue(context);
    const controller = new AbortController();
    const response = await POST(request('Hola', controller.signal));
    controller.abort();
    const events = await response.text();
    expect(events).toContain('"type":"abort"');
    expect(events).not.toContain('"type":"finish"');
  });
});
