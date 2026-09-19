import type { ReactNode } from 'react';

interface LabelledBlockProps {
  /** What the block contains; never a restatement of the section heading. */
  title: string;
  /** Heading level, so the outline of the page stays correct. */
  level?: 3 | 4;
  children: ReactNode;
}

/**
 * Titles one block inside a section or a card with the same micro heading.
 *
 * @param props - Heading, its level and the content of the block.
 * @returns A labelled block.
 */
export function LabelledBlock({
  title,
  level = 4,
  children,
}: LabelledBlockProps) {
  const Heading = level === 3 ? 'h3' : 'h4';
  return (
    <div className="flex flex-col gap-2">
      <Heading className="text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </Heading>
      {children}
    </div>
  );
}
