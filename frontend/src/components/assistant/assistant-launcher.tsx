'use client';

import { Button } from '@heroui/react';
import { useEffect, useState } from 'react';
import { NexoMascot, type NexoMood } from '@/components/assistant/nexo-mascot';

/** How long the invitation stays on screen before it fades away. */
const BUBBLE_VISIBLE_MS = 5000;
/** Matches the `nexo-bubble-out` animation length in nexo.css. */
const BUBBLE_FADE_MS = 400;

type BubblePhase = 'in' | 'out' | 'gone';

/**
 * Floating access: only the character and a short invitation; the dialog holds
 * the rest. The invitation shows for five seconds and then fades out, so the
 * character stays but nothing keeps covering the figures it floats over. On a
 * phone the character is smaller and the invitation is left out altogether.
 */
export function AssistantLauncher({
  mood,
  onHoverChange,
}: {
  mood: NexoMood;
  onHoverChange: (hovered: boolean) => void;
}) {
  const [bubble, setBubble] = useState<BubblePhase>('in');

  useEffect(() => {
    const hide = window.setTimeout(() => setBubble('out'), BUBBLE_VISIBLE_MS);
    const remove = window.setTimeout(
      () => setBubble('gone'),
      BUBBLE_VISIBLE_MS + BUBBLE_FADE_MS,
    );
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(remove);
    };
  }, []);

  return (
    <Button
      variant="ghost"
      aria-label="Abrir Nexo, asistente de Pulse"
      aria-keyshortcuts="Control+j Meta+j"
      onHoverChange={onHoverChange}
      className="nexo-launcher fixed right-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 h-auto min-w-0 flex-col items-end gap-0 overflow-visible rounded-3xl p-1 [--button-bg-hover:transparent] [--button-bg-pressed:transparent] sm:right-5 sm:bottom-4"
    >
      {bubble !== 'gone' && (
        <span
          data-phase={bubble}
          className="nexo-bubble relative mr-16 hidden rounded-2xl rounded-br-sm bg-surface px-3 py-2 text-xs font-medium whitespace-nowrap text-foreground shadow-md sm:inline"
        >
          ¿Necesitas ayuda? Escríbeme
        </span>
      )}
      <NexoMascot
        mood={mood}
        className="size-16 drop-shadow-[0_12px_14px_rgba(10,30,80,0.22)] sm:size-28"
      />
    </Button>
  );
}
