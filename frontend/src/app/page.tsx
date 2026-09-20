import { preload } from 'react-dom';

import { HeroAccess } from '@/components/layout/hero-access';
import { LandingBar } from '@/components/layout/landing-bar';
import { LandingFooter } from '@/components/layout/landing-footer';
import { LandingScroll } from '@/components/layout/landing-scroll';
import { LandingShowcase } from '@/components/layout/landing-showcase';
import { PulseHeroDither } from '@/components/layout/pulse-hero-dither';
import { SiteFrame } from '@/components/layout/site-frame';
import { PULSE_HERO_DITHER_IMAGE } from '@/lib/landing/pulse-hero-dither';

/**
 * Marketing landing: three viewport-tall bands inside the site frame.
 *
 * The hero carries the product bar, a dithered sparkle field and product
 * access: PULSE is the `h1` and the monthly line sits under the links. Below
 * `lg` the dither sits behind the links so both share one column; from `lg`
 * it occupies the left pane. The webp is `preload`ed here so the fetch
 * starts with the document; Paper still owns the canvas. The middle band
 * lists the product pages and, from `lg`, shows the figure of the selected
 * cell, opening on PULSE. The footer is heatmap (desktop) and lists.
 *
 * @returns The framed landing page.
 */
export default function LandingPage() {
  preload(PULSE_HERO_DITHER_IMAGE, { as: 'image', type: 'image/webp' });

  return (
    <SiteFrame split pulse>
      <LandingScroll>
        <section className="landing-band-dark relative grid h-dvh snap-start snap-always grid-cols-[var(--site-gutter)_minmax(0,1fr)_var(--site-gutter)] border-b border-separator lg:grid-cols-[var(--site-gutter)_minmax(0,1fr)_minmax(0,1fr)_var(--site-gutter)]">
          <LandingBar />
          <div className="col-start-1" />
          <div className="pointer-events-none absolute inset-0 max-lg:z-0 lg:relative lg:inset-auto lg:col-start-2 lg:h-full lg:min-h-0">
            <div className="hero-dither pointer-events-none absolute inset-0 overflow-hidden">
              <PulseHeroDither />
            </div>
          </div>
          <div className="relative z-[1] col-start-2 flex h-full items-center px-[var(--landing-inset)] pt-20 pb-8 lg:col-start-3 lg:py-10">
            <div className="flex w-full flex-col gap-8 lg:gap-12">
              <HeroAccess />
              <p className="max-w-xl text-[15px] leading-[1.55] text-ink-secondary lg:text-[17px] lg:leading-[1.6]">
                Cada mes: cómo está y hacia dónde va
              </p>
            </div>
          </div>
          <div className="col-start-3 lg:col-start-4" />
        </section>
        <LandingShowcase />
        <LandingFooter />
      </LandingScroll>
    </SiteFrame>
  );
}
