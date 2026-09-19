/** Local sparkle source for the hero ImageDithering shader. */
export const PULSE_HERO_DITHER_IMAGE = '/hero-dither.webp';

/**
 * Paper ImageDithering uniforms for the landing hero’s left pane.
 *
 * The webp is shape only, not a Pulse lockup. `originalColors` is off so the
 * front/highlight can sit lighter than Paper’s 1-step original-color pass.
 * `colorBack` is opaque black: the canvas multiplies onto the score quadrants
 * beneath it, so black hides the field where there is no sparkle and the
 * band's `screen` blend then drops that black onto the navy. `fit`/`scale`
 * come from Tender iris.
 */
export const PULSE_HERO_DITHER = {
  image: PULSE_HERO_DITHER_IMAGE,
  originalColors: false,
  inverted: false,
  type: '4x4',
  size: 3.5,
  colorSteps: 2,
  scale: 0.86,
  fit: 'contain',
  colorBack: '#000000',
  colorFront: '#afafbb',
  colorHighlight: '#ffffff',
  maxPixelCount: 480_000,
} as const;
