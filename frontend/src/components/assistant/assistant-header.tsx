import { Button, Modal } from '@heroui/react';
import { AssistantIcon } from '@/components/assistant/assistant-icon';
import { NexoMascot, type NexoMood } from '@/components/assistant/nexo-mascot';
import type { AssistantController } from '@/components/assistant/use-assistant';
import { getPageLabel, type AssistantMode } from '@/lib/assistant/types';

/** Puts the character's expression into words so the state never relies on the drawing alone. */
export function statusLabel(mood: NexoMood, mode: AssistantMode): string {
  switch (mood) {
    case 'error':
      return 'Algo ha fallado. Podemos reintentarlo.';
    case 'thinking':
      return 'Revisando tu pregunta…';
    case 'speaking':
      return 'Escribiendo…';
    case 'listening':
      return 'Te escucho.';
    default:
      return mode === 'mock'
        ? 'Demo · respuestas simuladas con datos de la app.'
        : 'Pregúntame por tu empresa, sus productos o el score.';
  }
}

/** Dialog header: identity, live status, current page, and the two global actions. */
export function AssistantHeader({
  chat,
  mode,
  mood,
}: {
  chat: AssistantController;
  mode: AssistantMode;
  mood: NexoMood;
}) {
  return (
    <Modal.Header className="flex shrink-0 flex-col gap-2 px-5 pt-4 pb-3 sm:px-6">
      <div className="flex items-center gap-3">
        <NexoMascot mood={mood} className="size-12" />
        <div className="min-w-0 flex-1">
          <Modal.Heading className="text-base leading-tight font-semibold tracking-tight">
            Nexo
          </Modal.Heading>
          <p role="status" className="mt-0.5 truncate text-xs text-muted">
            {statusLabel(mood, mode)}
          </p>
        </div>
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="Nueva conversación"
          isDisabled={!chat.messages.length}
          onPress={() => void chat.reset()}
          className="size-9 text-muted"
        >
          <AssistantIcon name="reset" />
        </Button>
        <Modal.CloseTrigger
          aria-label="Cerrar Nexo"
          className="static size-9 text-muted"
        >
          <AssistantIcon name="close" />
        </Modal.CloseTrigger>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <AssistantIcon name="page" className="size-3.5" />
        <span>
          Viendo:{' '}
          <span className="font-medium text-foreground">
            {getPageLabel(chat.pathname)}
          </span>
        </span>
      </p>
    </Modal.Header>
  );
}
