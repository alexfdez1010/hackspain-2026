import { Button, TextArea } from '@heroui/react';
import { useRef } from 'react';
import { AssistantIcon } from '@/components/assistant/assistant-icon';
import type { AssistantController } from '@/components/assistant/use-assistant';
import { MAX_PROMPT_LENGTH, type AssistantMode } from '@/lib/assistant/types';

/** Accessible composer: Enter sends, Shift+Enter adds a line, IME composition is preserved. */
export function AssistantComposer({
  chat,
  mode,
  onFocusChange,
}: {
  chat: AssistantController;
  mode: AssistantMode;
  onFocusChange: (focused: boolean) => void;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  /** Submits the draft while preserving keyboard focus for follow-up questions. */
  function submit() {
    void chat.send();
    input.current?.focus();
  }
  return (
    <div className="shrink-0 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
      <form
        aria-label="Preguntar a Nexo"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="nexo-composer flex items-end gap-2 rounded-2xl bg-surface-secondary/80 p-1.5 pl-3 ring-2 ring-transparent transition-shadow focus-within:ring-accent/60"
      >
        <TextArea
          ref={input}
          aria-label="Tu pregunta para Nexo"
          aria-describedby="nexo-composer-hint"
          value={chat.input}
          onChange={(event) => chat.setInput(event.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          placeholder="Pregúntame sobre tu cartera…"
          maxLength={MAX_PROMPT_LENGTH}
          rows={1}
          className="max-h-32 min-h-9 flex-1 resize-none rounded-none border-0 bg-transparent px-0 py-2 text-base shadow-none field-sizing-content focus:outline-none sm:text-sm"
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {chat.busy ? (
          <Button
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label="Detener respuesta"
            onPress={() => void chat.stop()}
            className="size-9 shrink-0 rounded-xl"
          >
            <AssistantIcon name="stop" />
          </Button>
        ) : (
          <Button
            isIconOnly
            type="submit"
            size="sm"
            aria-label="Enviar pregunta"
            isDisabled={!chat.input.trim()}
            className="size-9 shrink-0 rounded-xl"
          >
            <AssistantIcon name="arrow" className="size-4.5" />
          </Button>
        )}
      </form>
      <p className="mt-2 flex justify-between gap-3 px-1 text-[10px] leading-relaxed text-muted">
        <span id="nexo-composer-hint" className="max-sm:sr-only">
          Enter envía · ⇧ Enter nueva línea
        </span>
        <span>
          {chat.input.length > 1800
            ? `${chat.input.length}/${MAX_PROMPT_LENGTH}`
            : mode === 'gateway'
              ? 'Puede equivocarse: contrasta con los datos.'
              : null}
        </span>
      </p>
    </div>
  );
}
