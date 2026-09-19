import type { AssistantMode } from '@/lib/assistant/types';

/** Selects mock without credentials; explicit gateway mode never silently falls back. */
export function getAssistantMode(
  env: Record<string, string | undefined> = process.env,
): AssistantMode {
  if (env.ASSISTANT_MODE === 'mock') return 'mock';
  if (env.ASSISTANT_MODE === 'gateway') return 'gateway';
  return env.AI_GATEWAY_API_KEY?.trim() ? 'gateway' : 'mock';
}

/** Product-selected Gateway model; never accepted from client input. */
export const ASSISTANT_MODEL = 'google/gemini-3.8-flash';
