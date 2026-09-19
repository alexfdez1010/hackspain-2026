/**
 * Colours the SVG charts paint with.
 *
 * SVG attributes cannot take a Tailwind utility, so the charts read the design
 * tokens directly. Every token names the foundation variable first and falls
 * back to the one the app already ships, so a chart keeps its colour while the
 * two sets live side by side.
 */

/** Rule and hairline separator inside a chart. */
export const HAIRLINE = 'var(--border-subtle, var(--separator))';

/** Observed data: the brand blue. */
export const BRAND_BLUE = 'var(--brand-blue, var(--accent))';

/** Predicted data: the brand sky, always dashed so it is never read as a fact. */
export const BRAND_SKY = 'var(--brand-sky, #8ed1fc)';

/** Recessed surface, used behind a marker so it reads as hollow. */
export const SURFACE_DEEP = 'var(--surface-deep, var(--surface-secondary))';
