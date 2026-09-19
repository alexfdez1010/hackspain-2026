'use client';

import { Heatmap } from '@paper-design/shaders-react';
import { useEffect, useState } from 'react';

import {
  heatmapSpeed,
  PULSE_FOOTER_HEATMAP,
} from '@/lib/landing/pulse-footer-heatmap';

/**
 * Paper Heatmap of the PULSE silhouette, filling the footer’s left pane.
 *
 * Decorative only: the footer name is already on the landmark. Reduced motion
 * freezes the grain (`speed={0}`) after mount, matching the paging rule.
 *
 * @returns A full-size Heatmap canvas.
 */
export function PulseFooterHeatmap() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }, []);

  return (
    <Heatmap
      aria-hidden
      className="h-full w-full"
      width="100%"
      height="100%"
      fit="contain"
      speed={heatmapSpeed(reduceMotion)}
      contour={PULSE_FOOTER_HEATMAP.contour}
      angle={PULSE_FOOTER_HEATMAP.angle}
      noise={PULSE_FOOTER_HEATMAP.noise}
      innerGlow={PULSE_FOOTER_HEATMAP.innerGlow}
      outerGlow={PULSE_FOOTER_HEATMAP.outerGlow}
      scale={PULSE_FOOTER_HEATMAP.scale}
      colors={[...PULSE_FOOTER_HEATMAP.colors]}
      colorBack={PULSE_FOOTER_HEATMAP.colorBack}
      image={PULSE_FOOTER_HEATMAP.image}
    />
  );
}
