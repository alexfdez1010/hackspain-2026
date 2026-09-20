'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';

import { PulseBandShowcase } from '@/components/layout/pulse-band-showcase';
import { PulseFeatureDither } from '@/components/layout/pulse-feature-dither';
import {
  bandFeature,
  featureBand,
  LANDING_FEATURES,
  landingFeature,
  type LandingFeatureId,
} from '@/lib/landing/landing-features';
import type { ScoreBandKey } from '@/lib/score';

/** Rows of the feature grid: the four pages in two columns. */
const ROWS = Math.ceil(LANDING_FEATURES.length / 2);

/**
 * Light landing band: preview on the left, the product pages on the right.
 *
 * The pane is already boxed by the site frame. The left column splits at
 * mid-band: the overline sits at nav height, the title and lead rest on the
 * plus, and the chart fills the lower half. The right column is a 2×2 of
 * the four pages of the landing with 1px rules between the rows. Copy uses
 * the same `px-4 sm:px-8` as the product chrome; the 2×2 stays flush. One
 * dither field sits behind the cells so the sparkle continues under the
 * rules, one sparkle per cell in the colour of one score level. Hover,
 * focus or press on a cell selects it: title, lead and the trajectory of
 * that cell's band. The same `selectedId` drives the level strip, so a
 * chip and a cell cannot disagree.
 *
 * @returns The middle landing section.
 */
export function LandingShowcase() {
  const [selectedId, setSelectedId] = useState<LandingFeatureId>('pulse');
  const selected = landingFeature(selectedId);
  const band = featureBand(selectedId);

  /**
   * Selects the cell that belongs to a score level.
   *
   * @param next - Band chosen from the level strip.
   */
  function selectBand(next: ScoreBandKey) {
    setSelectedId(bandFeature(next));
  }

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
        <div className="flex h-full flex-col justify-between px-4 py-2 sm:px-8 lg:py-4">
          <p className="text-[13px] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-muted">
            Producto
          </p>
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
              {selected.label}
            </h2>
            <p className="text-[15px] leading-[1.55] text-muted">
              {selected.lead}
            </p>
          </div>
        </div>
        <div className="flex h-full min-h-0 flex-col px-4 py-2 sm:px-8 lg:py-4">
          <PulseBandShowcase band={band} onBandChange={selectBand} />
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
                  onHoverStart={() => setSelectedId(feature.key)}
                  onFocus={() => setSelectedId(feature.key)}
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
