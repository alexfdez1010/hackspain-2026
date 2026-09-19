/** Animated Heatmap speed from the Tender iris Paper file. */
export const PULSE_FOOTER_HEATMAP_SPEED = 1.36;

/** Local black lockup used as the Heatmap silhouette. */
export const PULSE_FOOTER_HEATMAP_IMAGE = '/pulse-wordmark.svg';

/**
 * Paper Heatmap uniforms for the landing footer.
 *
 * Geometry comes from Tender iris. The color ramp is Embat ink → accent →
 * white so the glow sits on the dark band and does not use score colors.
 * `speed` is omitted: pass {@link heatmapSpeed} so reduced motion can freeze
 * the loop. The silhouette is the local wordmark, not a Paper CDN asset.
 */
export const PULSE_FOOTER_HEATMAP = {
  contour: 0.423,
  angle: -158,
  noise: 0.73,
  innerGlow: 0.13,
  outerGlow: 0.02,
  scale: 0.58,
  colors: ['#050b2c', '#232845', '#3878f6', '#5c92fe', '#ffffff'],
  colorBack: '#00000000',
  image: PULSE_FOOTER_HEATMAP_IMAGE,
} as const;

/**
 * Heatmap loop speed: Paper’s 1.36, or 0 when motion must stay still.
 *
 * @param reduceMotion - Whether `prefers-reduced-motion: reduce` is on.
 * @returns `0` to freeze the shader, otherwise {@link PULSE_FOOTER_HEATMAP_SPEED}.
 */
export function heatmapSpeed(reduceMotion: boolean): number {
  return reduceMotion ? 0 : PULSE_FOOTER_HEATMAP_SPEED;
}
