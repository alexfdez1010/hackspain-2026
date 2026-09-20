'use client';

import { Button, InfoIcon, Popover } from '@heroui/react';
import { useRef, useState, type ReactNode } from 'react';

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
 * place and works with a mouse, a keyboard and a finger alike:
 *
 * - Hovering opens the note and leaving closes it. Touch never hovers, so a
 *   phone only ever sees the press path.
 * - Pressing pins the note open: a tap on a phone, a click with a mouse or
 *   Enter on a keyboard. While pinned the note is modal, so a tap or click
 *   anywhere outside, on the button itself or Escape closes it.
 *
 * HeroUI's `Popover` already toggles its state when its trigger is pressed,
 * so the button must not toggle again by hand: on a phone the two toggles
 * would cancel each other and nothing would open. Instead the button only
 * records that a press is under way, and the open-change handler reads that
 * flag to tell "pressed while hovering, pin it" from "dismissed, close it".
 * The trigger is excluded from the outside-interaction check so that a
 * mouse click on it while hovering is not first closed by the focus move.
 *
 * @param props - The name of the figure, the explanation and button classes.
 * @returns The button with its popover.
 */
export function InfoTip({ label, children, className = '' }: InfoTipProps) {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pressing = useRef(false);
  const open = pinned || hovered;
  return (
    <Popover
      isOpen={open}
      onOpenChange={(next) => {
        const byPress = pressing.current;
        pressing.current = false;
        if (next || (byPress && !pinned)) {
          setPinned(true);
          return;
        }
        setPinned(false);
        setHovered(false);
      }}
    >
      <Button
        ref={trigger}
        variant="ghost"
        size="sm"
        isIconOnly
        aria-label={`Qué significa ${label}`}
        className={`size-5 min-w-0 shrink-0 rounded-full text-ink-muted hover:text-ink ${className}`.trim()}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onPressChange={(isPressed) => {
          if (isPressed) {
            pressing.current = true;
            return;
          }
          // The popover toggles synchronously right after the press ends;
          // clear the flag once that has run so a cancelled press leaves
          // nothing behind.
          queueMicrotask(() => {
            pressing.current = false;
          });
        }}
      >
        <InfoIcon className="size-3.5" />
      </Button>
      <Popover.Content
        placement="top"
        isNonModal={!pinned}
        shouldCloseOnInteractOutside={(element) =>
          !trigger.current?.contains(element)
        }
        className="max-w-72"
      >
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
