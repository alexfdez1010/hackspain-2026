'use client';

import { ImageDithering } from '@paper-design/shaders-react';

import { FEATURE_DITHER } from '@/lib/landing/landing-feature-dither';

/**
 * Paper ImageDithering of the hero sparkle behind the feature 2×2.
 *
 * Decorative only: the Buttons already name the surfaces. `speed={0}` pauses
 * rAF. Hover and selected states live on each cell in CSS, not uniforms.
 *
 * @returns A full-size ImageDithering canvas.
 */
export function PulseFeatureDither() {
  return (
    <ImageDithering
      aria-hidden
      className="h-full w-full"
      width="100%"
      height="100%"
      image={FEATURE_DITHER.image}
      originalColors={FEATURE_DITHER.originalColors}
      inverted={FEATURE_DITHER.inverted}
      type={FEATURE_DITHER.type}
      size={FEATURE_DITHER.size}
      colorSteps={FEATURE_DITHER.colorSteps}
      rotation={FEATURE_DITHER.rotation}
      fit={FEATURE_DITHER.fit}
      originX={FEATURE_DITHER.originX}
      originY={FEATURE_DITHER.originY}
      scale={FEATURE_DITHER.scale}
      speed={0}
      maxPixelCount={FEATURE_DITHER.maxPixelCount}
      colorBack={FEATURE_DITHER.colorBack}
      colorFront={FEATURE_DITHER.colorFront}
      colorHighlight={FEATURE_DITHER.colorFront}
    />
  );
}
