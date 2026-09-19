'use client';

import { useEffect, useRef } from 'react';

import { PULSE_SHOWCASE_ANIMATED_SVG } from '@/lib/landing/pulse-showcase-animated';
import { showcaseMotionPaused } from '@/lib/landing/pulse-showcase-motion';

/**
 * Marketing PULSE trajectory for the landing 2×2.
 *
 * Inlines the vendored SVG so CSS keyframes run and can freeze. SMIL, if a
 * later Quiver pass adds it, is paused through `pauseAnimations` when
 * `prefers-reduced-motion` is on. The accessible name lives on the SVG.
 *
 * @returns The animated chart.
 */
export function PulseShowcaseAnimation() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = root.current?.querySelector('svg');
    if (!svg) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      if (showcaseMotionPaused(media.matches)) svg.pauseAnimations();
      else svg.unpauseAnimations();
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  return (
    <div
      ref={root}
      data-showcase="pulse-animation"
      className="pulse-showcase-anim w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
      dangerouslySetInnerHTML={{ __html: PULSE_SHOWCASE_ANIMATED_SVG }}
    />
  );
}
