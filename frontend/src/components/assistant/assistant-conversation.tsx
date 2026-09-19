import { Button } from '@heroui/react';
import { useEffect, useRef } from 'react';
import { AssistantMessage } from '@/components/assistant/assistant-message';
import { NexoMascot } from '@/components/assistant/nexo-mascot';
import type { AssistantController } from '@/components/assistant/use-assistant';
import { messageText } from '@/lib/assistant/types';

/** Scrolls only while following the latest message; users can freely read older replies. */
export function AssistantConversation({ chat }: { chat: AssistantController }) {
  const container = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const last = chat.messages.at(-1);
  const waiting =
    chat.busy && (last?.role !== 'assistant' || !messageText(last));
  useEffect(() => {
    if (following.current && container.current)
      container.current.scrollTop = container.current.scrollHeight;
  }, [chat.messages, chat.status, chat.error]);
  return (
    <div
      ref={container}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-7"
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
        className="space-y-6"
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
          className="mt-4 flex items-center gap-3 text-xs text-muted"
        >
          <NexoMascot mood="thinking" className="size-12" />
          <span>Estoy revisando tu pregunta…</span>
        </div>
      ) : null}
      {chat.error ? (
        <div role="alert" className="mt-5 rounded-xl bg-danger/7 p-4">
          <p className="text-sm font-medium">No he podido responder.</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Tu pregunta sigue aquí. Puedes volver a intentarlo.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => void chat.retry()}
            className="mt-3"
          >
            Reintentar
          </Button>
        </div>
      ) : null}
      {chat.stopped ? (
        <div
          role="status"
          className="mt-4 flex items-center justify-between gap-2 text-xs text-muted"
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
