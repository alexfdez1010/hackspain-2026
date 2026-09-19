import { Button } from '@heroui/react';
import Link from 'next/link';
import { useState } from 'react';
import { AssistantIcon } from '@/components/assistant/assistant-icon';
import { MessageContent } from '@/components/assistant/message-content';
import { NexoMascot } from '@/components/assistant/nexo-mascot';
import {
  messageText,
  type AssistantMessage as Message,
} from '@/lib/assistant/types';

/** Renders one message with stable provenance, safe formatting, and a copy action. */
export function AssistantMessage({
  message,
  streaming,
  onNavigate,
}: {
  message: Message;
  streaming: boolean;
  onNavigate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const text = messageText(message);
  const user = message.role === 'user';
  /** Copies only visible response text; reports denied clipboard access in place. */
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  if (!user && !text) return null;
  if (user)
    return (
      <div className="ml-8 rounded-2xl rounded-br-md bg-accent/9 px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        <span className="sr-only">Tú: </span>
        {text}
      </div>
    );
  return (
    <article className="min-w-0" aria-label="Respuesta de Nexo">
      <div className="mb-2 flex items-center gap-2">
        <NexoMascot mood={streaming ? 'speaking' : 'idle'} className="size-9" />
        <span className="text-xs font-semibold">Nexo</span>
        {message.metadata?.mode === 'mock' ? (
          <span className="text-[10px] text-muted">DEMO</span>
        ) : null}
      </div>
      <MessageContent text={text} />
      {!streaming && text ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {message.metadata?.sources.map((source) => (
            <Link
              key={source.href}
              href={source.href}
              onClick={onNavigate}
              className="inline-flex items-center gap-1 text-[11px] text-muted underline decoration-muted/40 underline-offset-3 hover:text-foreground"
            >
              {source.label}
              <AssistantIcon name="chevron" className="size-2.5" />
            </Link>
          ))}
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label={copied ? 'Respuesta copiada' : 'Copiar respuesta'}
            onPress={copy}
            className="ml-auto size-8 min-w-8 text-muted"
          >
            <AssistantIcon name={copied ? 'check' : 'copy'} />
          </Button>
          {copyError ? (
            <span role="status" className="w-full text-xs text-danger">
              No se pudo copiar. Puedes seleccionar el texto.
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
