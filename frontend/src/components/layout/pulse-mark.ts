/** Fill used by the reverse (white) wordmark lockup. */
export const PULSE_MARK_WHITE = '#ffffff';

/** Cropped viewBox of the geometric `PULSE` wordmark. */
export const PULSE_MARK_VIEWBOX = '4 4 575 152';

/** Wordmark fill: inherit the text colour, or lock to white. */
export type PulseMarkTone = 'current' | 'white';

/**
 * Resolves the SVG fill for a wordmark tone.
 *
 * @param tone - `white` locks the reverse lockup; otherwise inherit text colour.
 * @returns A CSS colour or `currentColor`.
 */
export function pulseMarkFill(tone: PulseMarkTone = 'current'): string {
  return tone === 'white' ? PULSE_MARK_WHITE : 'currentColor';
}

/** One filled path in the wordmark. */
export type PulseMarkLetter = {
  id: string;
  d: string;
  evenodd?: boolean;
};

/**
 * Letter paths shared by the nav mark and the marketing hero.
 *
 * The U keeps only its left stem and a short bowl (no right stem).
 * L, S and E sit just after the trough so the missing stem leaves no gap.
 */
export const PULSE_MARK_LETTERS: readonly PulseMarkLetter[] = [
  {
    id: 'p',
    evenodd: true,
    d: 'm4.71 5.14h75.26c35.5 0 56.09 20.59 56.09 53.25 0 33.37-20.59 53.96-53.25 53.96h-39.76v42.6h-38.34zm63.9 26.98c-15.62 0-26.98 11.36-26.98 26.98 0 15.62 11.36 26.98 26.98 26.98 15.62 0 27.69-11.36 27.69-26.98 0-15.62-12.07-26.98-27.69-26.98z',
  },
  {
    id: 'u',
    d: 'm148.1 5.14h39.76v93.01c0 12.07 8.96 19.17 28 22.72v34.79c-42.67-2.84-67.76-22.01-67.76-55.38z',
  },
  {
    id: 'l',
    d: 'm231.5 5.14h39.05v93.01c0 14.91 5.68 22.72 20.59 22.72h37.63v34.08h-45.44c-34.08 0-51.83-18.46-51.83-52.54z',
  },
  {
    id: 's',
    d: 'm447.4 5.14v32.66h-60.35c-9.94 0-14.91 3.55-14.91 12.07 0 8.52 5.68 12.07 15.62 12.07h18.46c29.82 0 47.57 17.04 47.57 45.44 0 29.11-17.04 47.57-44.02 47.57h-69.58v-34.08h61.06c8.52 0 13.49-4.26 13.49-12.78 0-7.81-4.97-12.78-13.49-12.78h-19.17c-31.24 0-48.99-15.62-48.99-43.31 0-28.4 17.75-46.86 45.44-46.86z',
  },
  {
    id: 'e',
    d: 'm465.1 5.14h112.2v32.66h-73.84v24.85h59.64v32.66h-59.64v25.56h74.55v34.08h-112.9z',
  },
];
