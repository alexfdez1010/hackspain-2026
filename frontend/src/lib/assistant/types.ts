import type { UIMessage } from 'ai';

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
}

export type AssistantMessage = UIMessage<AssistantMetadata>;
export const MAX_PROMPT_LENGTH = 2_000;
export const MAX_HISTORY_MESSAGES = 20;

/** Only text conversations and known application paths cross this boundary. */
export interface AssistantRequest {
  messages: AssistantMessage[];
  pathname: string;
}

/** Resolves a page label from a local pathname; unknown pages use a safe label. */
export function getPageLabel(pathname: string): string {
  const company = pathname.match(/^\/(empresa|pulse)\/(COMP_\d{4})$/);
  if (company)
    return `${company[1] === 'pulse' ? 'PULSE' : 'Radiografía'} · ${company[2]}`;
  return (
    (
      {
        '/': 'Radar de cartera',
        '/pulse': 'Cartera PULSE',
        '/capital': 'Embat Capital',
        '/monitor': 'Monitor de alertas',
        '/metodo': 'Metodología',
      } as Record<string, string>
    )[pathname] ?? 'Embat Pulse'
  );
}

/** Extracts rendered text, ignoring all non-text SDK parts without side effects. */
export function messageText(message: AssistantMessage): string {
  return message.parts
    .flatMap((part) => (part.type === 'text' ? [part.text] : []))
    .join('');
}
