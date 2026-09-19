/**
 * Whether the marketing PULSE SVG must freeze.
 *
 * @param reduceMotion - `prefers-reduced-motion: reduce`.
 * @returns `true` when SMIL and CSS animations must pause.
 */
export function showcaseMotionPaused(reduceMotion: boolean): boolean {
  return reduceMotion;
}

const MOTION_CSS = `<style>
@keyframes pulse-draw{
0%{stroke-dashoffset:1}
20%,90%{stroke-dashoffset:0}
100%{stroke-dashoffset:1}
}
@keyframes pulse-fade{
0%,18%{opacity:0}
35%,90%{opacity:1}
100%{opacity:0}
}
@keyframes pulse-mark{
0%,48%{transform:scale(1)}
62%{transform:scale(1.18)}
76%,90%{transform:scale(1)}
100%{transform:scale(1)}
}
#pulse-observed{stroke-dasharray:1;stroke-dashoffset:1;animation:pulse-draw 7.2s cubic-bezier(.65,0,.35,1) infinite}
#pulse-band,#pulse-forecast,#pulse-boundary{opacity:0;animation:pulse-fade 7.2s cubic-bezier(.65,0,.35,1) infinite}
#pulse-close{transform-box:fill-box;transform-origin:center;animation:pulse-mark 7.2s cubic-bezier(.65,0,.35,1) infinite}
@media (prefers-reduced-motion:reduce){
#pulse-observed,#pulse-forecast,#pulse-band,#pulse-boundary,#pulse-close{animation:none;opacity:1;stroke-dashoffset:0;transform:none}
}
</style>`;

/**
 * Adds a looping draw/fade/pulse to a showcase SVG that already has the
 * `pulse-observed`, `pulse-forecast`, `pulse-band` and `pulse-close` ids.
 *
 * Observed draws first, then the p10-p90 band and dashed forecast fade in,
 * then the last-close mark breathes. Reduced-motion CSS inside the SVG
 * freezes the final frame.
 *
 * @param svg - Static showcase SVG.
 * @returns The same document with motion, or the input when it is empty.
 */
export function withPulseShowcaseMotion(svg: string): string {
  if (!svg.startsWith('<svg')) return svg;
  const withLength = svg.replace(
    'id="pulse-observed"',
    'id="pulse-observed" pathLength="1"',
  );
  return withLength.replace('>', `>${MOTION_CSS}`);
}
