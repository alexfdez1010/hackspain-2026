import { PULSE_HERO_DITHER_IMAGE } from '@/lib/landing/pulse-hero-dither';

/**
 * Paper ImageDithering uniforms for the landing feature column.
 *
 * One canvas covers the whole grid so the hero sparkle continues under the
 * rules. `cover` fills the column; light-band ink (`#0d1130`), no `screen`
 * blend. Hover and selected states live on each cell in CSS. `speed` stays
 * 0 at the canvas.
 */
export const FEATURE_DITHER = {
  image: PULSE_HERO_DITHER_IMAGE,
  originalColors: false,
  inverted: false,
  fit: 'cover',
  originX: 0.5,
  originY: 0.5,
  scale: 1,
  type: '4x4',
  size: 3.5,
  colorSteps: 2,
  rotation: 0,
  colorBack: '#00000000',
  colorFront: '#0d1130',
  maxPixelCount: 480_000,
} as const;
