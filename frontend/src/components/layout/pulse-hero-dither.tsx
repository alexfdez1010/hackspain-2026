'use client';

import { ImageDithering } from '@paper-design/shaders-react';
import { useEffect, useState } from 'react';

import { PULSE_HERO_DITHER } from '@/lib/landing/pulse-hero-dither';

/**
 * Paper ImageDithering of the hero sparkle field.
 *
 * Decorative only: the accessible name stays on the page `h1`. The canvas
 * fills the column with `contain`; blend and band opacity live in CSS. The
 * inner wrapper stays transparent until the webp has decoded so the navy
 * band paints first.
 *
 * @returns A full-size ImageDithering canvas.
 */
export function PulseHeroDither() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    const markReady = () => {
      if (!cancelled) setReady(true);
    };
    image.onload = markReady;
    image.onerror = markReady;
    image.src = PULSE_HERO_DITHER.image;
    if (image.complete) markReady();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="hero-dither-canvas" data-ready={ready ? '' : undefined}>
      <ImageDithering
        aria-hidden
        className="h-full w-full"
        width="100%"
        height="100%"
        image={PULSE_HERO_DITHER.image}
        originalColors={PULSE_HERO_DITHER.originalColors}
        inverted={PULSE_HERO_DITHER.inverted}
        type={PULSE_HERO_DITHER.type}
        size={PULSE_HERO_DITHER.size}
        colorSteps={PULSE_HERO_DITHER.colorSteps}
        scale={PULSE_HERO_DITHER.scale}
        fit={PULSE_HERO_DITHER.fit}
        colorBack={PULSE_HERO_DITHER.colorBack}
        colorFront={PULSE_HERO_DITHER.colorFront}
        colorHighlight={PULSE_HERO_DITHER.colorHighlight}
        maxPixelCount={PULSE_HERO_DITHER.maxPixelCount}
      />
    </div>
  );
}
