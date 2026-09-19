import { generateText, Output } from 'ai';

import type { ActionContext } from '@/lib/actions/context';
import { normaliseTarget } from '@/lib/actions/links';
import {
  actionsInstructions,
  actionsPrompt,
  actionsSchema,
  type ActionsOutput,
} from '@/lib/actions/prompt';
import {
  MAX_ACTIONS,
  MAX_DETAIL_LENGTH,
  MAX_TITLE_LENGTH,
  type CompanyAction,
} from '@/lib/actions/types';
import {
  ASSISTANT_MODEL,
  ASSISTANT_PROVIDER_OPTIONS,
} from '@/lib/assistant/config';

/** Model deadline for one actions call; the page falls back after it. */
export const ACTIONS_TIMEOUT_MS = 30_000;

/** Three short actions never need more; the cap bounds the cost per call. */
export const ACTIONS_MAX_OUTPUT_TOKENS = 4_000;

/** Collapses whitespace and cuts at the last word before the limit. */
function clip(text: string, limit: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 0)) || cut}…`;
}

/**
 * Keeps only what the page can show: at most three non-empty actions, each
 * clipped to its length and with a target the app can route.
 *
 * @param output - Parsed model output.
 * @param variableKeys - Keys of the eleven variables, for variable targets.
 * @returns Safe actions; empty when the model gave nothing usable.
 */
export function sanitiseActions(
  output: ActionsOutput | undefined,
  variableKeys: readonly string[],
): CompanyAction[] {
  if (!output) return [];
  return output.actions
    .map((action) => ({
      title: clip(action.title, MAX_TITLE_LENGTH),
      detail: clip(action.detail, MAX_DETAIL_LENGTH),
      target: normaliseTarget(action.target, variableKeys),
    }))
    .filter((action) => action.title.length > 0)
    .slice(0, MAX_ACTIONS);
}

/** Signature of the model call, so the service can inject a fake in tests. */
export type ActionsGenerator = (
  context: ActionContext,
  variableKeys: readonly string[],
) => Promise<CompanyAction[]>;

/**
 * Asks the Gateway model for the actions of one company as a typed object.
 *
 * The caller decides what to do when this rejects; the page never shows a
 * model error, it shows the deterministic actions instead.
 *
 * @param context - Compact company context.
 * @param variableKeys - Keys of the eleven variables, for variable targets.
 * @returns Sanitised actions.
 */
export const generateActions: ActionsGenerator = async (
  context,
  variableKeys,
) => {
  const { output } = await generateText({
    model: ASSISTANT_MODEL,
    instructions: actionsInstructions(),
    prompt: actionsPrompt(context),
    output: Output.object({ schema: actionsSchema, name: 'acciones' }),
    providerOptions: ASSISTANT_PROVIDER_OPTIONS,
    maxOutputTokens: ACTIONS_MAX_OUTPUT_TOKENS,
    abortSignal: AbortSignal.timeout(ACTIONS_TIMEOUT_MS),
    maxRetries: 1,
  });
  return sanitiseActions(output, variableKeys);
};
