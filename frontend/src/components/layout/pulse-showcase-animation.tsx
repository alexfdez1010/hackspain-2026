'use client';

import { useEffect, useRef } from 'react';

import { showcaseMotionPaused } from '@/lib/landing/pulse-showcase-motion';

interface PulseShowcaseAnimationProps {
  /** Showcase SVG document, already carrying its motion CSS. */
  svg: string;
}

/**
 * Marketing PULSE trajectory for the landing preview.
 *
 * Inlines the SVG so its CSS keyframes run and can freeze. SMIL, if a later
 * pass adds it, is paused through `pauseAnimations` when
 * `prefers-reduced-motion` is on. The accessible name lives on the SVG.
 * Remounting with a different `key` restarts the loop from its first frame.
 *
 * @param props - The SVG string to inline.
 * @returns The animated chart.
 */
export function PulseShowcaseAnimation({ svg }: PulseShowcaseAnimationProps) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = root.current?.querySelector('svg');
    if (!node) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (showcaseMotionPaused(media.matches)) node.pauseAnimations();
      else node.unpauseAnimations();
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [svg]);

  return (
    <div
      ref={root}
      data-showcase="pulse-animation"
      className="pulse-showcase-anim w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
