'use client';

import { ImageDithering } from '@paper-design/shaders-react';

import { FOOTER_DITHER } from '@/lib/landing/pulse-footer-dither';

/**
 * Paper ImageDithering of the hero sparkle behind the footer lists.
 *
 * Decorative only: Platform / Docs already name the pane. `speed={0}` pauses
 * rAF. Blend and band opacity live in CSS, not uniforms.
 *
 * @returns A full-size ImageDithering canvas.
 */
export function PulseFooterDither() {
  return (
    <ImageDithering
      aria-hidden
      className="h-full w-full"
      width="100%"
      height="100%"
      image={FOOTER_DITHER.image}
      originalColors={FOOTER_DITHER.originalColors}
      inverted={FOOTER_DITHER.inverted}
      type={FOOTER_DITHER.type}
      size={FOOTER_DITHER.size}
      colorSteps={FOOTER_DITHER.colorSteps}
      rotation={FOOTER_DITHER.rotation}
      fit={FOOTER_DITHER.fit}
      originX={FOOTER_DITHER.originX}
      originY={FOOTER_DITHER.originY}
      scale={FOOTER_DITHER.scale}
      speed={0}
      maxPixelCount={FOOTER_DITHER.maxPixelCount}
      colorBack={FOOTER_DITHER.colorBack}
      colorFront={FOOTER_DITHER.colorFront}
      colorHighlight={FOOTER_DITHER.colorHighlight}
    />
  );
}
