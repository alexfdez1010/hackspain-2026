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
    <div className="shrink-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
      <form
        aria-label="Preguntar a Nexo"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="rounded-2xl bg-surface-secondary/75 p-2 ring-1 ring-border/60 transition-shadow focus-within:ring-2 focus-within:ring-accent/50"
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
          rows={2}
          className="max-h-32 min-h-15 w-full resize-none rounded-lg border-0 bg-transparent px-2 py-2 text-base shadow-none focus:outline-none sm:text-sm"
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
        <div className="flex items-center justify-between px-1 pb-0.5">
          <span id="nexo-composer-hint" className="text-[10px] text-muted">
            {chat.input.length > 1800
              ? `${chat.input.length}/${MAX_PROMPT_LENGTH}`
              : 'Enter para enviar · ⇧ Enter nueva línea'}
          </span>
          {chat.busy ? (
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label="Detener respuesta"
              onPress={() => void chat.stop()}
              className="size-9 rounded-xl"
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
              className="size-9 rounded-xl"
            >
              <AssistantIcon name="arrow" className="size-4.5" />
            </Button>
          )}
        </div>
      </form>
      <p className="mt-2.5 text-center text-[10px] leading-relaxed text-muted">
        {mode === 'mock'
          ? 'Modo demo · Respuestas simuladas con datos de la app.'
          : 'Nexo puede equivocarse. Contrasta los datos de origen.'}
      </p>
    </div>
  );
}
