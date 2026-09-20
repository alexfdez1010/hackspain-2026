import { PULSE_HERO_DITHER_IMAGE } from '@/lib/landing/pulse-hero-dither';

/**
 * Paper ImageDithering uniforms for the landing footer’s right pane.
 *
 * Same webp as the 2×2, but a rotated crop (`scale` 1.8, origin off-centre)
 * so a fragment of the sparkles reads without filling the lists.
 * Dark-band colours and `screen` live in CSS; `speed` stays 0 at the canvas.
 * Not the Heatmap silhouette.
 */
export const FOOTER_DITHER = {
  image: PULSE_HERO_DITHER_IMAGE,
  originalColors: false,
  inverted: false,
  fit: 'cover',
  originX: 0.68,
  originY: 0.32,
  scale: 1.8,
  type: '4x4',
  size: 3.5,
  colorSteps: 2,
  rotation: 28,
  colorBack: '#00000000',
  colorFront: '#afafbb',
  colorHighlight: '#ffffff',
  maxPixelCount: 480_000,
} as const;
