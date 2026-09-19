import type { ReactNode } from 'react';

interface DetailNoteProps {
  children: ReactNode;
}

/**
 * One line of context under a figure, a chart or a table of the drill-down.
 *
 * The same element carries the reading of the month and the empty state, so a
 * block with nothing to show still says what is missing instead of vanishing.
 *
 * @param props - The sentence to print.
 * @returns The note paragraph.
 */
export function DetailNote({ children }: DetailNoteProps) {
  return (
    <p className="max-w-[720px] text-[15px] leading-[1.55] text-ink-secondary">
      {children}
    </p>
  );
}
