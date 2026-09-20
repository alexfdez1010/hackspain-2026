'use client';

import { Button, InfoIcon, Popover } from '@heroui/react';
import { useState, type ReactNode } from 'react';

interface InfoTipProps {
  /** What the figure or column is called; names the button for assistive technology. */
  label: string;
  /** The explanation in plain words, one or two sentences. */
  children: ReactNode;
  /** Extra utilities for the button, such as its place next to a label. */
  className?: string;
}

/**
 * A 20 px icon-only button that explains a figure on hover and on press.
 *
 * The prototype hangs its explanations on `title` attributes, which a touch
 * screen never shows and a keyboard never reaches. The button takes their
 * place: hovering opens the note and leaving closes it; pressing pins it open
 * until the reader presses again, taps outside or presses Escape, so it works
 * with a mouse, a keyboard and a finger alike. The note is a non-modal
 * popover in body size with no heading: the label of the figure is already
 * on the page, next to the button.
 *
 * @param props - The name of the figure, the explanation and button classes.
 * @returns The button with its popover.
 */
export function InfoTip({ label, children, className = '' }: InfoTipProps) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const open = pinned || hovered;
  return (
    <Popover
      isOpen={open}
      onOpenChange={(next) => {
        setPinned(next);
        if (!next) setHovered(false);
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        aria-label={`Qué significa ${label}`}
        className={`size-5 min-w-0 shrink-0 rounded-full text-ink-muted hover:text-ink ${className}`.trim()}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onPress={() => setPinned((current) => !current)}
      >
        <InfoIcon className="size-3.5" />
      </Button>
      <Popover.Content placement="top" isNonModal className="max-w-72">
        <Popover.Dialog
          aria-label={label}
          className="text-[13px] leading-[1.45] text-ink"
        >
          {children}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
