'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';

import { PulseTrajectoryChart } from '@/components/charts/pulse-trajectory';
import { PulseFeatureDither } from '@/components/layout/pulse-feature-dither';
import { PulseShowcaseAnimation } from '@/components/layout/pulse-showcase-animation';
import {
  LANDING_FEATURES,
  landingFeature,
  landingPreview,
  type LandingFeatureId,
} from '@/lib/landing/landing-features';
import type { PulseTrajectoryPoint } from '@/lib/pulse/company-view';

interface LandingShowcaseProps {
  /** Observed months followed by the forecast horizons. */
  points: readonly PulseTrajectoryPoint[];
  /** Index of the last observed month; `-1` when there is no history. */
  boundaryIndex: number;
}

/**
 * Light landing band: preview on the left, 2×2 features on the right.
 *
 * The pane is already boxed by the site frame. The plus is one 1px cross:
 * the vertical arm is the frame axis; the horizontal arm runs gutter to
 * gutter at mid-band. The 2×2 only adds its inner vertical split. One dither
 * field sits behind the four Buttons so the sparkle continues under the plus.
 * PULSE shows the animated marketing trajectory; the other cells keep the
 * product chart.
 *
 * @param props - Demo company trajectory for the non-PULSE chart.
 * @returns The middle landing section.
 */
export function LandingShowcase({
  points,
  boundaryIndex,
}: LandingShowcaseProps) {
  const [selectedId, setSelectedId] = useState<LandingFeatureId>('pulse');
  const selected = landingFeature(selectedId);

  return (
    <section
      aria-label="Producto"
      className="landing-band-light relative grid h-dvh snap-start snap-always grid-cols-[var(--site-gutter)_minmax(0,1fr)_var(--site-gutter)] border-b border-separator lg:grid-cols-[var(--site-gutter)_minmax(0,1fr)_minmax(0,1fr)_var(--site-gutter)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[var(--site-gutter)] top-1/2 z-10 hidden h-px bg-separator lg:block"
      />
      <div className="col-start-1" />
      <div className="col-start-2 grid min-h-0 grid-rows-[auto_1fr] lg:h-full lg:grid-rows-2">
        <div className="flex flex-col justify-center px-6 py-10 sm:px-10">
          <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
            {selected.label}
          </h2>
          <p className="mt-2 text-sm text-muted">{selected.lead}</p>
        </div>
        <div className="flex min-h-0 flex-col justify-center px-6 py-10 sm:px-10">
          {landingPreview(selectedId) === 'pulse-animation' ? (
            <PulseShowcaseAnimation />
          ) : (
            <PulseTrajectoryChart
              points={points}
              boundaryIndex={boundaryIndex}
            />
          )}
        </div>
      </div>
      <div className="relative col-start-2 min-h-0 lg:col-start-3 lg:h-full">
        <div className="feature-dither pointer-events-none absolute inset-0 overflow-hidden">
          <PulseFeatureDither />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 z-10 h-full w-px bg-separator"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 z-10 h-px w-full bg-separator lg:hidden"
        />
        <div
          role="group"
          aria-label="Superficies"
          className="relative grid h-full min-h-64 grid-cols-2 grid-rows-2"
        >
          {LANDING_FEATURES.map((feature) => {
            const pressed = feature.id === selectedId;
            return (
              <div
                key={feature.id}
                data-feature={feature.id}
                className="feature-cell relative min-h-0 min-w-0 overflow-hidden"
              >
                <Button
                  variant="tertiary"
                  aria-pressed={pressed}
                  onPress={() => setSelectedId(feature.id)}
                  className="relative z-[1] h-full min-w-0 w-full flex-col items-start justify-center rounded-none bg-transparent px-4 py-5 text-left whitespace-normal text-foreground shadow-none [--button-bg-hover:transparent] [--button-bg-pressed:transparent] hover:bg-transparent sm:px-6 sm:py-8"
                >
                  <span className="font-display text-lg tracking-tight sm:text-xl">
                    {feature.label}
                  </span>
                  <span className="feature-lead mt-2 text-xs font-normal text-muted sm:text-sm">
                    {feature.lead}
                  </span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="col-start-3 lg:col-start-4" />
    </section>
  );
}
