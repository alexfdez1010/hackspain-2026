'use client';

import { Modal } from '@heroui/react';
import { useState } from 'react';
import { AssistantComposer } from '@/components/assistant/assistant-composer';
import { AssistantConversation } from '@/components/assistant/assistant-conversation';
import { AssistantHeader } from '@/components/assistant/assistant-header';
import { AssistantLauncher } from '@/components/assistant/assistant-launcher';
import { AssistantWelcome } from '@/components/assistant/assistant-welcome';
import type { NexoMood } from '@/components/assistant/nexo-mascot';
import { useAssistant } from '@/components/assistant/use-assistant';
import type { AssistantMode } from '@/lib/assistant/types';

/** Derives the single expression shown everywhere from chat state and pointer intent. */
function deriveMood(
  chat: ReturnType<typeof useAssistant>,
  focused: boolean,
  hovered: boolean,
): NexoMood {
  if (chat.error) return 'error';
  if (chat.status === 'submitted') return 'thinking';
  if (chat.status === 'streaming') return 'speaking';
  if (focused) return 'listening';
  return hovered ? 'happy' : 'idle';
}

/** Global Nexo launcher and responsive HeroUI dialog; conversation lives outside the overlay. */
export function AssistantWidget({ mode }: { mode: AssistantMode }) {
  const chat = useAssistant();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const mood = deriveMood(chat, focused, hovered);
  return (
    <Modal isOpen={chat.open} onOpenChange={chat.setOpen}>
      <AssistantLauncher mood={mood} onHoverChange={setHovered} />
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
            <AssistantHeader chat={chat} mode={mode} mood={mood} />
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
