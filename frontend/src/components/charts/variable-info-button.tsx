'use client';

import { Button, InfoIcon, Popover } from '@heroui/react';
import { useState } from 'react';

import type { VariableInfo } from '@/lib/method/variable-info';

interface VariableInfoButtonProps {
  info: VariableInfo;
  className?: string;
}

/**
 * An icon-only button that explains a variable on hover and on press.
 *
 * Hovering opens the card and leaving closes it; pressing pins it open until
 * the reader presses again, taps outside or presses Escape, so it works with
 * a mouse, a keyboard and a touch screen alike.
 *
 * @param props - The explanation and optional classes for the button.
 * @returns The button with its popover.
 */
export function VariableInfoButton({
  info,
  className,
}: VariableInfoButtonProps) {
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
        aria-label={info.buttonLabel}
        className={className}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onPress={() => setPinned((current) => !current)}
      >
        <InfoIcon className="size-3.5" />
      </Button>
      <Popover.Content placement="top" isNonModal className="max-w-72">
        <Popover.Dialog
          aria-label={info.title}
          className="flex flex-col gap-1.5 text-sm"
        >
          <Popover.Heading className="text-sm font-semibold">
            {info.title}
          </Popover.Heading>
          <p>{info.measures}</p>
          <p className="text-muted">
            {info.direction} · {info.source}
            {info.proxy ? `. Sin ERP: ${info.proxy.toLowerCase()}` : ''}
          </p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
