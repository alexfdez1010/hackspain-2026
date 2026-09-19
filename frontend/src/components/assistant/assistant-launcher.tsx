import { Button } from '@heroui/react';
import { NexoMascot, type NexoMood } from '@/components/assistant/nexo-mascot';

/**
 * Floating access: only the character and a short invitation; the dialog holds
 * the rest. On a phone the character is smaller and the invitation is left
 * out, so the launcher never covers the figures it floats over.
 */
export function AssistantLauncher({
  mood,
  onHoverChange,
}: {
  mood: NexoMood;
  onHoverChange: (hovered: boolean) => void;
}) {
  return (
    <Button
      variant="ghost"
      aria-label="Abrir Nexo, asistente de Pulse"
      aria-keyshortcuts="Control+j Meta+j"
      onHoverChange={onHoverChange}
      className="nexo-launcher fixed right-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 h-auto min-w-0 flex-col items-end gap-0 overflow-visible rounded-3xl p-1 [--button-bg-hover:transparent] [--button-bg-pressed:transparent] sm:right-5 sm:bottom-4"
    >
      <span className="nexo-bubble relative mr-16 hidden rounded-2xl rounded-br-sm bg-surface px-3 py-2 text-xs font-medium whitespace-nowrap text-foreground shadow-md sm:inline">
        ¿Necesitas ayuda? Escríbeme
      </span>
      <NexoMascot
        mood={mood}
        className="size-16 drop-shadow-[0_12px_14px_rgba(10,30,80,0.22)] sm:size-28"
      />
    </Button>
  );
}
