'use client';

import { Button, Modal } from '@heroui/react';
import { useState } from 'react';
import { AssistantComposer } from '@/components/assistant/assistant-composer';
import { AssistantConversation } from '@/components/assistant/assistant-conversation';
import { AssistantIcon } from '@/components/assistant/assistant-icon';
import { AssistantWelcome } from '@/components/assistant/assistant-welcome';
import { NexoMascot, type NexoMood } from '@/components/assistant/nexo-mascot';
import { useAssistant } from '@/components/assistant/use-assistant';
import { getPageLabel, type AssistantMode } from '@/lib/assistant/types';

/** Global Nexo launcher and responsive HeroUI dialog; conversation lives outside the overlay. */
export function AssistantWidget({ mode }: { mode: AssistantMode }) {
  const chat = useAssistant();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const mood: NexoMood = chat.error
    ? 'error'
    : chat.status === 'submitted'
      ? 'thinking'
      : chat.status === 'streaming'
        ? 'speaking'
        : focused
          ? 'listening'
          : hovered
            ? 'happy'
            : 'idle';
  return (
    <Modal isOpen={chat.open} onOpenChange={chat.setOpen}>
      <Button
        variant="secondary"
        aria-label="Abrir Nexo, asistente de Pulse"
        aria-keyshortcuts="Control+j Meta+j"
        onHoverChange={setHovered}
        className="nexo-launcher fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 h-15 overflow-visible rounded-2xl bg-surface pr-5 pl-19 shadow-lg sm:right-7 sm:bottom-6"
      >
        <NexoMascot
          mood={mood}
          className="pointer-events-none absolute -top-7 -left-2 size-24"
        />
        <span className="text-left">
          <span className="block text-[13px] font-semibold">
            Pregunta a Nexo
          </span>
          <span className="mt-0.5 block text-[11px] font-normal text-muted">
            Tu asistente de Pulse
          </span>
        </span>
      </Button>
      <Modal.Backdrop className="bg-black/15 backdrop-blur-[2px]">
        <Modal.Container
          placement="bottom"
          scroll="inside"
          className="items-end justify-end p-0 sm:p-6"
        >
          <Modal.Dialog
            aria-label="Nexo, asistente de Pulse"
            className="nexo-panel flex h-[min(760px,100dvh)] max-h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-t-3xl bg-surface p-0 sm:h-[min(760px,calc(100dvh-3rem))] sm:w-[440px] sm:max-w-[440px] sm:rounded-3xl"
          >
            <Modal.Header className="flex shrink-0 flex-row items-center justify-between gap-3 px-6 pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <AssistantIcon name="pulse" className="size-5" />
                </div>
                <div>
                  <Modal.Heading className="text-base font-semibold tracking-tight">
                    Nexo
                  </Modal.Heading>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Tu asistente de Pulse
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-2 rounded-md bg-surface-secondary px-2 py-1 text-[10px] font-medium text-muted">
                  {mode === 'mock' ? 'DEMO' : 'CONECTADO'}
                </span>
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
            </Modal.Header>
            <div className="mx-6 mb-3 flex shrink-0 items-center gap-2 rounded-lg bg-surface-secondary/55 px-3 py-2 text-[11px] text-muted">
              <AssistantIcon name="page" className="size-3.5" />
              <span>
                Viendo:{' '}
                <span className="font-medium text-foreground">
                  {getPageLabel(chat.pathname)}
                </span>
              </span>
            </div>
            {chat.messages.length ? (
              <AssistantConversation chat={chat} />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <AssistantWelcome
                  pathname={chat.pathname}
                  mood={mood}
                  onSelect={(text) => void chat.send(text)}
                />
              </div>
            )}
            {chat.messages.length && (chat.busy || focused || chat.error) ? (
              <div
                role="status"
                className="flex shrink-0 items-center gap-1.5 px-6 text-[11px] text-muted"
              >
                <NexoMascot mood={mood} className="size-7" />
                <span>
                  {chat.error
                    ? 'Podemos volver a intentarlo'
                    : chat.busy
                      ? 'Preparando tu respuesta'
                      : 'Te escucho'}
                </span>
              </div>
            ) : null}
            <AssistantComposer
              chat={chat}
              mode={mode}
              onFocusChange={setFocused}
            />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
