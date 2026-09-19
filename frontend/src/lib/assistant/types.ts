import type { UIMessage } from 'ai';

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

export type AssistantMessage = UIMessage<AssistantMetadata>;
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
    if (pathname.endsWith('/signals')) return `Señales · ${name}`;
    if (pathname.endsWith('/diagnosis')) return `Diagnóstico · ${name}`;
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
