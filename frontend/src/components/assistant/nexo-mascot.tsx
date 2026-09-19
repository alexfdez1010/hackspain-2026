'use client';

import Image from 'next/image';
import type { PointerEvent } from 'react';

export type NexoMood =
  'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'error';
const moods: NexoMood[] = [
  'idle',
  'listening',
  'thinking',
  'speaking',
  'happy',
  'error',
];

/** Renders a persistent expression layer; CSS crossfades it without restarting the body. */
function NexoExpression({ mood }: { mood: NexoMood }) {
  const mouths = {
    idle: 'M566 595Q625 645 684 595',
    listening: 'M594 610Q625 630 656 610',
    thinking: 'M606 615H650',
    speaking: 'M590 590Q625 570 660 590Q670 644 625 649Q580 644 590 590Z',
    happy: 'M565 580Q625 660 685 580',
    error: 'M582 625Q625 601 668 625',
  };
  return (
    <svg
      viewBox="0 0 1254 1254"
      className="size-full"
      fill="none"
      stroke="#b9ecff"
      strokeLinecap="round"
      strokeWidth="16"
    >
      <g className="nexo-gaze">
        {mood === 'happy' ? (
          <path
            d="M437 523Q480 445 523 523M727 523Q770 445 813 523"
            strokeWidth="22"
          />
        ) : (
          <g className="nexo-eyes" fill="#b9ecff" stroke="none">
            <rect
              x="452"
              y={mood === 'thinking' ? 462 : 477}
              width="48"
              height={mood === 'listening' ? 95 : 82}
              rx="24"
            />
            <rect
              x="746"
              y="477"
              width="48"
              height={mood === 'thinking' ? 65 : 82}
              rx="24"
            />
          </g>
        )}
        <path
          className={mood === 'speaking' ? 'nexo-mouth' : ''}
          d={mouths[mood]}
          fill={mood === 'speaking' ? '#b9ecff' : 'none'}
        />
        {mood === 'error' ? (
          <path d="m440 442 67-19m235 0 67 19" strokeWidth="12" />
        ) : null}
      </g>
    </svg>
  );
}

/** Tracks a nearby pointer in CSS variables without React renders; touch stays still. */
function followPointer(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== 'mouse') return;
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty(
    '--nexo-look-x',
    `${((event.clientX - bounds.left) / bounds.width - 0.5) * 5}px`,
  );
  event.currentTarget.style.setProperty(
    '--nexo-look-y',
    `${((event.clientY - bounds.top) / bounds.height - 0.5) * 3}px`,
  );
}

/** Restores the neutral gaze when the pointer leaves the character. */
function resetGaze(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.setProperty('--nexo-look-x', '0px');
  event.currentTarget.style.setProperty('--nexo-look-y', '0px');
}

/** Decorative suited mascot; fixed dimensions avoid shifts and reduced motion disables movement. */
export function NexoMascot({
  mood = 'idle',
  className = 'size-32',
}: {
  mood?: NexoMood;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-mood={mood}
      className={`nexo relative isolate shrink-0 select-none ${className}`}
      onPointerMove={followPointer}
      onPointerLeave={resetGaze}
    >
      <div className="nexo-float size-full">
        <div className="nexo-pose relative size-full">
          <Image
            src="/mascot/nexo-suit.png"
            alt=""
            width={1254}
            height={1254}
            sizes="160px"
            className="pointer-events-none size-full object-contain"
            draggable={false}
          />
          {moods.map((expression) => (
            <div
              key={expression}
              data-visible={expression === mood}
              className="nexo-expression pointer-events-none absolute inset-0"
            >
              <NexoExpression mood={expression} />
            </div>
          ))}
        </div>
      </div>
      <div className="nexo-thoughts absolute top-1 right-0 flex gap-1 text-accent">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
