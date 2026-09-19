import { Button } from '@heroui/react';
import { useEffect, useRef } from 'react';
import { AssistantMessage } from '@/components/assistant/assistant-message';
import { NexoMascot } from '@/components/assistant/nexo-mascot';
import type { AssistantController } from '@/components/assistant/use-assistant';
import { hasContent } from '@/lib/assistant/types';

/** Scrolls only while following the latest message; users can freely read older replies. */
export function AssistantConversation({ chat }: { chat: AssistantController }) {
  const container = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const last = chat.messages.at(-1);
  const waiting =
    chat.busy && (last?.role !== 'assistant' || !hasContent(last));
  useEffect(() => {
    if (following.current && container.current)
      container.current.scrollTop = container.current.scrollHeight;
  }, [chat.messages, chat.status, chat.error]);
  return (
    <div
      ref={container}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6"
      onScroll={(event) => {
        const node = event.currentTarget;
        following.current =
          node.scrollHeight - node.scrollTop - node.clientHeight < 70;
      }}
    >
      <div
        role="log"
        aria-label="Conversación con Nexo"
        aria-live="polite"
        aria-busy={chat.busy}
        className="flex flex-col gap-5"
      >
        {chat.messages.map((message, index) => (
          <AssistantMessage
            key={message.id}
            message={message}
            streaming={chat.busy && index === chat.messages.length - 1}
            onNavigate={() => chat.setOpen(false)}
          />
        ))}
      </div>
      {waiting ? (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 text-xs text-muted"
        >
          <NexoMascot mood="thinking" className="size-10" />
          <span>
            {chat.working
              ? 'Consultando los datos de la empresa…'
              : 'Estoy revisando tu pregunta…'}
          </span>
        </div>
      ) : null}
      {chat.error ? (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-danger/8 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">No he podido responder.</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Tu pregunta sigue aquí.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => void chat.retry()}
          >
            Reintentar
          </Button>
        </div>
      ) : null}
      {chat.stopped ? (
        <div
          role="status"
          className="mt-3 flex items-center justify-between gap-2 text-xs text-muted"
        >
          <span>Respuesta detenida.</span>
          <Button size="sm" variant="ghost" onPress={() => void chat.retry()}>
            Volver a generar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
