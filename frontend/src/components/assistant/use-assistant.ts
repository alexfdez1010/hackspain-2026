'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  MAX_HISTORY_MESSAGES,
  MAX_PROMPT_LENGTH,
  messageText,
  type AssistantMessage,
} from '@/lib/assistant/types';

/** Keeps chat in the root shell across page changes; credentials remain on the server. */
export function useAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [stopped, setStopped] = useState(false);
  const [transport] = useState(
    () =>
      new DefaultChatTransport<AssistantMessage>({
        api: '/api/assistant',
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: {
            ...body,
            messages: messages
              .filter((message) => messageText(message).trim())
              .slice(-MAX_HISTORY_MESSAGES),
          },
        }),
      }),
  );
  const chat = useChat<AssistantMessage>({ transport });
  const busy = chat.status === 'submitted' || chat.status === 'streaming';
  const sending = useRef(false);

  useEffect(() => {
    /** Toggles the assistant with a deliberate shortcut without intercepting typing. */
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  /** Submits nonempty bounded text once, including the current route as context. */
  async function send(text = input) {
    if (
      busy ||
      sending.current ||
      !text.trim() ||
      text.length > MAX_PROMPT_LENGTH
    )
      return;
    sending.current = true;
    setInput('');
    setStopped(false);
    chat.clearError();
    try {
      await chat.sendMessage({ text: text.trim() }, { body: { pathname } });
    } finally {
      sending.current = false;
    }
  }

  /** Cancels generation while retaining partial text and the original question. */
  async function stop() {
    await chat.stop();
    setStopped(true);
  }

  /** Retries the last question with the same current-route context, without duplicating it. */
  async function retry() {
    setStopped(false);
    await chat.regenerate({ body: { pathname } });
  }

  /** Starts a fresh in-memory conversation; aborts any generation before clearing it. */
  async function reset() {
    await chat.stop();
    chat.setMessages([]);
    chat.clearError();
    setInput('');
    setStopped(false);
  }

  return {
    ...chat,
    pathname,
    open,
    setOpen,
    input,
    setInput,
    stopped,
    busy,
    send,
    stop,
    retry,
    reset,
  };
}

export type AssistantController = ReturnType<typeof useAssistant>;
