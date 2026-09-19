'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';

import { PulseBandShowcase } from '@/components/layout/pulse-band-showcase';
import { PulseFeatureDither } from '@/components/layout/pulse-feature-dither';
import {
  LANDING_FEATURES,
  landingFeature,
  type LandingFeatureId,
} from '@/lib/landing/landing-features';
import type { ScoreBandKey } from '@/lib/score';

interface LandingShowcaseProps {
  /** Band of the demo company's last close; the chart opens on it. */
  initialBand: ScoreBandKey;
}

/** Rows of the feature grid: the catalogue in two columns. */
const ROWS = Math.ceil(LANDING_FEATURES.length / 2);

/**
 * Light landing band: preview on the left, the product pages on the right.
 *
 * The pane is already boxed by the site frame. The left column splits at
 * mid-band into the page title and the band chart; the right column is a
 * two-column grid of every product page with 1px rules between the rows.
 * One dither field sits behind the cells so the sparkle continues under the
 * rules. Choosing a cell only changes the title and the lead: the chart is
 * the same PULSE trajectory for every page, coloured by score level.
 *
 * @param props - The band the chart opens on.
 * @returns The middle landing section.
 */
export function LandingShowcase({ initialBand }: LandingShowcaseProps) {
  const [selectedId, setSelectedId] = useState<LandingFeatureId>('pulse');
  const selected = landingFeature(selectedId);

  return (
    <section
      aria-label="Producto"
      className="landing-band-light relative grid h-dvh snap-start snap-always grid-cols-[var(--site-gutter)_minmax(0,1fr)_var(--site-gutter)] border-b border-separator lg:grid-cols-[var(--site-gutter)_minmax(0,1fr)_minmax(0,1fr)_var(--site-gutter)]"
    >
      <div className="col-start-1" />
      <div className="relative col-start-2 grid min-h-0 grid-rows-[auto_1fr] lg:h-full lg:grid-rows-2">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 hidden h-px bg-separator lg:block"
        />
        <div className="flex flex-col justify-center px-6 py-8 sm:px-10">
          <p className="text-[13px] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-muted">
            Producto
          </p>
          <h2 className="mt-3 font-display text-2xl tracking-tight text-foreground sm:text-3xl">
            {selected.label}
          </h2>
          <p className="mt-2 text-[15px] text-muted">{selected.lead}</p>
        </div>
        <div className="flex min-h-0 flex-col justify-center px-6 py-8 sm:px-10">
          <PulseBandShowcase initialBand={initialBand} />
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
        {Array.from({ length: ROWS - 1 }, (_, index) => (
          <div
            key={index}
            aria-hidden
            className="pointer-events-none absolute left-0 z-10 h-px w-full bg-separator"
            style={{ top: `${((index + 1) / ROWS) * 100}%` }}
          />
        ))}
        <div
          role="group"
          aria-label="Superficies"
          className="relative grid h-full min-h-64 grid-cols-2"
          style={{ gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}
        >
          {LANDING_FEATURES.map((feature) => {
            const pressed = feature.key === selectedId;
            return (
              <div
                key={feature.key}
                data-feature={feature.key}
                className="feature-cell relative min-h-0 min-w-0 overflow-hidden"
              >
                <Button
                  variant="tertiary"
                  aria-pressed={pressed}
                  onPress={() => setSelectedId(feature.key)}
                  className="relative z-[1] h-full min-w-0 w-full flex-col items-start justify-center rounded-none bg-transparent px-4 py-4 text-left whitespace-normal text-foreground shadow-none [--button-bg-hover:transparent] [--button-bg-pressed:transparent] hover:bg-transparent sm:px-6 sm:py-6"
                >
                  <span className="font-display text-lg tracking-tight sm:text-xl">
                    {feature.label}
                  </span>
                  <span className="feature-lead mt-1.5 text-xs font-normal text-muted sm:text-sm">
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
