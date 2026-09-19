import { describe, expect, it } from 'vitest';
import { ASSISTANT_MODEL, getAssistantMode } from '@/lib/assistant/config';
import {
  parseAssistantRequest,
  readAssistantRequest,
} from '@/lib/assistant/request';
import { getPageLabel, MAX_PROMPT_LENGTH } from '@/lib/assistant/types';

const message = {
  id: 'user-1',
  role: 'user',
  parts: [{ type: 'text', text: 'Resume mi cartera' }],
};

describe('assistant configuration', () => {
  it('uses the requested fixed Gemini model', () => {
    expect(ASSISTANT_MODEL).toBe('google/gemini-3.8-flash');
  });
  it('uses mocks without a key and gateway with a key', () => {
    expect(getAssistantMode({})).toBe('mock');
    expect(getAssistantMode({ AI_GATEWAY_API_KEY: 'test' })).toBe('gateway');
  });
  it('honors forced modes without silently changing gateway to mock', () => {
    expect(
      getAssistantMode({ AI_GATEWAY_API_KEY: 'test', ASSISTANT_MODE: 'mock' }),
    ).toBe('mock');
    expect(getAssistantMode({ ASSISTANT_MODE: 'gateway' })).toBe('gateway');
  });
});

describe('assistant request boundary', () => {
  it('keeps text and strips client metadata and model overrides', () => {
    const parsed = parseAssistantRequest({
      pathname: '/empresa/COMP_0001',
      model: 'other',
      messages: [{ ...message, metadata: { mode: 'gateway' } }],
    });
    expect(parsed).toEqual({
      pathname: '/empresa/COMP_0001',
      messages: [message],
    });
  });
  it.each([
    'https://evil.test',
    '//evil.test',
    '/empresa/../../secret',
    '/unknown',
    '/pulse/COMP_0001',
  ])('does not use an untrusted path: %s', (pathname) => {
    expect(
      parseAssistantRequest({ pathname, messages: [message] }).pathname,
    ).toBe('/');
  });
  it.each([
    null,
    {},
    { messages: [] },
    { messages: [{ ...message, role: 'system' }] },
    { messages: [{ ...message, role: 'assistant' }] },
    { messages: [message, message] },
    { messages: [{ ...message, parts: [{ type: 'text', text: ' ' }] }] },
    {
      messages: [
        { ...message, parts: [{ type: 'file', url: 'https://evil.test' }] },
      ],
    },
    {
      messages: [
        {
          ...message,
          parts: [{ type: 'text', text: 'x'.repeat(MAX_PROMPT_LENGTH + 1) }],
        },
      ],
    },
    {
      messages: Array.from({ length: 21 }, (_, i) => ({
        ...message,
        id: String(i),
      })),
    },
  ])('rejects malformed, unsafe, or oversized messages', (body) => {
    expect(() => parseAssistantRequest(body)).toThrow();
  });
  it('accepts assistant SDK step markers while retaining only text', () => {
    const parsed = parseAssistantRequest({
      messages: [
        {
          id: 'answer',
          role: 'assistant',
          parts: [{ type: 'step-start' }, { type: 'text', text: 'Hola' }],
        },
        message,
      ],
    });
    expect(parsed.messages[0].parts).toEqual([{ type: 'text', text: 'Hola' }]);
  });
  it('rejects invalid JSON and non-JSON content', async () => {
    await expect(
      readAssistantRequest(
        new Request('http://localhost/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{',
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      readAssistantRequest(
        new Request('http://localhost/api/assistant', {
          method: 'POST',
          body: '{}',
        }),
      ),
    ).rejects.toMatchObject({ status: 415 });
  });
  it('limits actual bytes even without Content-Length', async () => {
    const request = new Request('http://localhost/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'á'.repeat(40_000),
    });
    await expect(readAssistantRequest(request)).rejects.toMatchObject({
      status: 413,
    });
  });
  it('rejects cross-origin browser requests', async () => {
    const request = new Request('http://localhost/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://evil.test',
      },
      body: JSON.stringify({ messages: [message] }),
    });
    await expect(readAssistantRequest(request)).rejects.toMatchObject({
      status: 403,
    });
  });
  it('labels company and section context without interpreting arbitrary URLs', () => {
    expect(getPageLabel('/empresa/COMP_0001')).toBe('PULSE · COMP_0001');
    expect(getPageLabel('/empresa/COMP_0001/recomendaciones')).toBe(
      'Recomendaciones · COMP_0001',
    );
    expect(getPageLabel('/metodo')).toBe('Método');
    expect(getPageLabel('/unknown')).toBe('Embat Pulse');
  });
});
