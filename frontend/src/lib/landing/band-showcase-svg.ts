import { bandShowcaseTrajectory } from '@/lib/landing/band-trajectories';
import { withPulseShowcaseMotion } from '@/lib/landing/pulse-showcase-motion';
import {
  pulseShowcaseLabel,
  pulseShowcaseSvg,
} from '@/lib/landing/pulse-showcase-svg';
import { SCORE_BANDS, type ScoreBandKey } from '@/lib/score';

/** Animated showcase SVG of one band with its accessible name. */
export interface BandShowcase {
  band: ScoreBandKey;
  svg: string;
  label: string;
}

/**
 * Builds the animated marketing chart of one band.
 *
 * @param band - Band to illustrate.
 * @returns The SVG with motion and the name the SVG carries.
 */
export function bandShowcase(band: ScoreBandKey): BandShowcase {
  const { points, boundaryIndex } = bandShowcaseTrajectory(band);
  return {
    band,
    svg: withPulseShowcaseMotion(pulseShowcaseSvg(points, boundaryIndex)),
    label: pulseShowcaseLabel(points, boundaryIndex),
  };
}

/**
 * The four showcase charts, worst band first, built once per module load so
 * the landing never serialises an SVG twice.
 */
export const BAND_SHOWCASES: readonly BandShowcase[] = SCORE_BANDS.map((band) =>
  bandShowcase(band.key),
);

/**
 * Showcase of a band, or the first one when the key is unknown.
 *
 * @param band - Requested band.
 * @returns The matching showcase.
 */
export function bandShowcaseFor(band: string): BandShowcase {
  return (
    BAND_SHOWCASES.find((showcase) => showcase.band === band) ??
    BAND_SHOWCASES[0]
  );
}
