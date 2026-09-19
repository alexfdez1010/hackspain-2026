import type { streamText } from 'ai';
import type { AssistantMode } from '@/lib/assistant/types';

type ProviderOptions = NonNullable<
  Parameters<typeof streamText>[0]['providerOptions']
>;

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

/**
 * Gemini 3.x spends output tokens on hidden reasoning before it writes. At the
 * default level a short reply burned ~900 of 1.000 tokens and stopped mid-sentence
 * (`finishReason: length`). Low thinking leaves the whole budget for visible text.
 */
export const ASSISTANT_PROVIDER_OPTIONS: ProviderOptions = {
  google: { thinkingConfig: { thinkingLevel: 'low' } },
};

/** Generous cap so long answers never stop mid-sentence; cost stays bounded per call. */
export const ASSISTANT_MAX_OUTPUT_TOKENS = 10_000;

/** Model deadline; must stay below the route's `maxDuration`. */
export const ASSISTANT_TIMEOUT_MS = 55_000;
