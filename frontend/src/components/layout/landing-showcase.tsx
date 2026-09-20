'use client';

import Link from 'next/link';
import { useState } from 'react';

import { LandingFeaturePreview } from '@/components/layout/landing-feature-preview';
import { PulseFeatureDither } from '@/components/layout/pulse-feature-dither';
import {
  LANDING_FEATURES,
  landingFeature,
  type LandingFeatureId,
} from '@/lib/landing/landing-features';

/** Rows of the feature grid: the four pages in two columns. */
const ROWS = Math.ceil(LANDING_FEATURES.length / 2);

/**
 * Light landing band: preview on the left, the product pages on the right.
 *
 * The pane is already boxed by the site frame. From `lg` the left column
 * splits at mid-band: the title sits at nav height, the lead rests on the
 * plus, and the figure of that page fills the lower half. The right column
 * is a 2×2 of the four pages of the landing with 1px rules between the
 * rows. Below `lg` the preview is hidden and the 2×2 fills the band: a
 * tap follows the link, so the hover figure would never show. Copy uses
 * the same `px-4 sm:px-8` as the product chrome; the 2×2 stays flush.
 * One dither field sits behind the cells so the sparkle continues under
 * the rules, one sparkle per cell in the colour of one score level.
 *
 * Every cell is a `next/link` to its page of the demo company. Hover or
 * focus previews it on the left: title, lead and the figure of that page
 * (trajectory, diagnosis notice, alert or approved line). The previewed
 * cell is marked with `data-selected`, never with a pressed state: a link
 * is not a toggle.
 *
 * @returns The middle landing section.
 */
export function LandingShowcase() {
  const [selectedId, setSelectedId] = useState<LandingFeatureId>('pulse');
  const selected = landingFeature(selectedId);

  return (
    <section
      aria-label="Producto"
      className="landing-band-light relative grid h-dvh snap-start snap-always grid-cols-[var(--site-gutter)_minmax(0,1fr)_var(--site-gutter)] border-b border-separator lg:grid-cols-[var(--site-gutter)_minmax(0,1fr)_minmax(0,1fr)_var(--site-gutter)]"
    >
      <div className="col-start-1" />
      <div className="relative col-start-2 hidden min-h-0 lg:grid lg:h-full lg:grid-rows-2">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 hidden h-px bg-separator lg:block"
        />
        <div className="flex h-full flex-col justify-between px-4 py-2 sm:px-8 lg:py-4">
          <h2 className="font-display text-2xl tracking-tight text-foreground sm:text-3xl">
            {selected.label}
          </h2>
          <p className="text-[15px] leading-[1.55] text-pretty text-muted">
            {selected.lead}
          </p>
        </div>
        <div className="flex h-full min-h-0 flex-col px-4 py-2 sm:px-8 lg:py-4">
          <LandingFeaturePreview featureId={selectedId} />
        </div>
      </div>
      <div className="relative col-start-2 h-full min-h-0 lg:col-start-3">
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
          className="relative grid h-full grid-cols-2"
          style={{ gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))` }}
        >
          {LANDING_FEATURES.map((feature) => {
            const selected = feature.key === selectedId;
            return (
              <div
                key={feature.key}
                data-feature={feature.key}
                className="feature-cell relative min-h-0 min-w-0"
              >
                <Link
                  href={feature.href}
                  data-selected={selected}
                  onMouseEnter={() => setSelectedId(feature.key)}
                  onFocus={() => setSelectedId(feature.key)}
                  className="relative z-[1] flex h-full min-w-0 w-full flex-col items-start justify-center px-4 py-4 text-left text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus lg:px-6 lg:py-6"
                >
                  <span className="font-display text-lg tracking-tight lg:text-xl">
                    {feature.label}
                  </span>
                  <span className="feature-lead mt-1.5 text-[13px] font-normal leading-[1.45] text-pretty text-muted">
                    {feature.lead}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
      <div className="col-start-3 lg:col-start-4" />
    </section>
  );
}
