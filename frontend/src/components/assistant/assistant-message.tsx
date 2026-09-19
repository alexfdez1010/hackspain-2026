import { Button } from '@heroui/react';
import Link from 'next/link';
import { useState } from 'react';
import { AssistantIcon } from '@/components/assistant/assistant-icon';
import { MessageParts } from '@/components/assistant/message-parts';
import {
  hasContent,
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
  const truncated = message.metadata?.finishReason === 'length';
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
  if (!user && !hasContent(message) && !streaming) return null;
  if (user)
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent px-4 py-2.5 text-[13px] leading-relaxed break-words whitespace-pre-wrap text-accent-foreground [overflow-wrap:anywhere]">
        <span className="sr-only">Tú: </span>
        {text}
      </div>
    );
  return (
    <article className="min-w-0 max-w-[94%]" aria-label="Respuesta de Nexo">
      <MessageParts message={message} onNavigate={onNavigate} />
      {streaming ? null : (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {message.metadata?.sources.map((source) => (
            <Link
              key={source.href}
              href={source.href}
              onClick={onNavigate}
              className="inline-flex items-center gap-0.5 text-[11px] text-muted underline decoration-muted/40 underline-offset-3 hover:text-foreground"
            >
              {source.label}
              <AssistantIcon name="chevron" className="size-2.5" />
            </Link>
          ))}
          {message.metadata?.mode === 'mock' ? (
            <span className="text-[10px] font-medium tracking-wide text-muted">
              DEMO
            </span>
          ) : null}
          {text ? (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label={copied ? 'Respuesta copiada' : 'Copiar respuesta'}
              onPress={copy}
              className="ml-auto size-7 min-w-7 text-muted"
            >
              <AssistantIcon name={copied ? 'check' : 'copy'} />
            </Button>
          ) : null}
          {truncated ? (
            <p role="status" className="w-full text-[11px] text-muted">
              Respuesta recortada por longitud. Pídeme que continúe.
            </p>
          ) : null}
          {copyError ? (
            <span role="status" className="w-full text-xs text-danger">
              No se pudo copiar. Puedes seleccionar el texto.
            </span>
          ) : null}
        </div>
      )}
    </article>
  );
}
