import type { UIDataTypes, UIMessage } from 'ai';

import type { ChartModelOutput } from '@/lib/assistant/charts/types';
import { isAssistantToolPartType } from '@/lib/assistant/tools/names';
import type { AssistantUITools } from '@/lib/assistant/tools';
import { companyName } from '@/lib/company/names';
import { companyIdFromPath, variableKeyFromPath } from '@/lib/routes';

/** The server selects the provider; the browser never receives credentials. */
export type AssistantMode = 'mock' | 'gateway';

/** A verified, internal source supplied by the server, never by model output. */
export interface AssistantSource {
  label: string;
  href: string;
}

/** Provenance travels with each response, including after navigation. */
export interface AssistantMetadata {
  mode: AssistantMode;
  sources: AssistantSource[];
  /** Set by the server when the model finishes; `length` means the reply was cut. */
  finishReason?: string;
}

/** A message of the conversation: text, plus the tool parts of a reply. */
export type AssistantMessage = UIMessage<
  AssistantMetadata,
  UIDataTypes,
  AssistantUITools
>;

/** One part of a message. */
export type AssistantPart = AssistantMessage['parts'][number];

/** The chart part, with the full specification once the tool has run. */
export type AssistantChartPart = Extract<
  AssistantPart,
  { type: 'tool-show_chart' }
>;

export const MAX_PROMPT_LENGTH = 2_000;
export const MAX_HISTORY_MESSAGES = 20;

/** Only text conversations and known application paths cross this boundary. */
export interface AssistantRequest {
  messages: AssistantMessage[];
  pathname: string;
}

/**
 * Resolves a page label from a local pathname; unknown pages use a safe label.
 *
 * @param pathname - Application pathname, already validated by the server.
 * @returns A Spanish label naming the section and, on company pages, the company.
 */
export function getPageLabel(pathname: string): string {
  const companyId = companyIdFromPath(pathname);
  if (companyId) {
    const name = companyName(companyId);
    const variableKey = variableKeyFromPath(pathname);
    if (variableKey) return `Variable ${variableKey} · ${name}`;
    if (pathname.endsWith('/recommendations')) return `Financiación · ${name}`;
    if (pathname.endsWith('/signals')) return `Alertas · ${name}`;
    if (pathname.endsWith('/diagnosis')) return `Diagnóstico · ${name}`;
    if (/\/action(\/[^/]+)?$/.test(pathname)) return `Acción · ${name}`;
    if (pathname.endsWith('/detail')) return `Detalle · ${name}`;
    return `PULSE · ${name}`;
  }
  if (pathname === '/method') return 'Método';
  return 'Embat Pulse';
}

/** Extracts rendered text, ignoring all non-text SDK parts without side effects. */
export function messageText(message: AssistantMessage): string {
  return message.parts
    .flatMap((part) => (part.type === 'text' ? [part.text] : []))
    .join('');
}

/**
 * Tells whether a part is one of Nexo's tool invocations.
 *
 * @param part - Any part of a message.
 * @returns `true` for the parts of the known tools.
 */
export function isAssistantToolPart(
  part: AssistantPart,
): part is Extract<AssistantPart, { type: `tool-${string}` }> {
  return isAssistantToolPartType(part.type);
}

/**
 * Tells whether a message carries anything worth sending or showing: text,
 * or a tool that produced an output.
 *
 * @param message - Message to check.
 * @returns `true` when the message has content.
 */
export function hasContent(message: AssistantMessage): boolean {
  return (
    messageText(message).trim().length > 0 ||
    message.parts.some(
      (part) => isAssistantToolPart(part) && part.state === 'output-available',
    )
  );
}

/**
 * Tells whether a reply is still waiting for a tool to finish.
 *
 * @param message - The assistant message being streamed.
 * @returns `true` while a tool call has no output yet.
 */
export function hasPendingTool(message: AssistantMessage): boolean {
  return message.parts.some(
    (part) =>
      isAssistantToolPart(part) &&
      (part.state === 'input-streaming' || part.state === 'input-available'),
  );
}

/**
 * Replaces the data of a drawn chart with the sentence the model was given,
 * so the history sent back to the server stays small.
 *
 * @param message - Message about to be sent.
 * @returns The same message with compact chart outputs.
 */
export function compactMessage(message: AssistantMessage): AssistantMessage {
  return {
    ...message,
    parts: message.parts.map((part) => {
      if (part.type !== 'tool-show_chart' || part.state !== 'output-available')
        return part;
      const output = part.output;
      const compact: ChartModelOutput =
        output.kind === 'error'
          ? { shown: false, kind: 'error', title: null, summary: output.error }
          : {
              shown: true,
              kind: output.kind,
              title: output.title,
              summary: output.summary,
            };
      return { ...part, output: compact as unknown as typeof output };
    }),
  };
}
