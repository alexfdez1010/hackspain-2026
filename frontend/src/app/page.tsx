import { preload } from 'react-dom';

import { HeroAccess } from '@/components/layout/hero-access';
import { LandingFooter } from '@/components/layout/landing-footer';
import { LandingScroll } from '@/components/layout/landing-scroll';
import { LandingShowcase } from '@/components/layout/landing-showcase';
import { PulseHeroDither } from '@/components/layout/pulse-hero-dither';
import { SiteFrame } from '@/components/layout/site-frame';
import { PULSE_HERO_DITHER_IMAGE } from '@/lib/landing/pulse-hero-dither';
import { buildTrajectory } from '@/lib/pulse/company-view';
import { getPulseDataSource } from '@/lib/pulse/data';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';

/**
 * Marketing landing: three viewport-tall bands inside the site frame.
 *
 * The hero splits a dithered sparkle field and product access: PULSE is the
 * `h1`, the monthly line sits under the links. The webp is `preload`ed here so
 * the fetch starts with the document; Paper still owns the canvas. The middle
 * band is a 2×2 of
 * product surfaces; PULSE plays the marketing trajectory. The footer is
 * heatmap and lists.
 *
 * @returns The framed landing page.
 */
export default async function LandingPage() {
  preload(PULSE_HERO_DITHER_IMAGE, { as: 'image', type: 'image/webp' });
  const company = await getPulseDataSource().getCompany(PULSE_DEMO_COMPANY_ID);
  const trajectory = buildTrajectory(
    company?.series ?? [],
    company?.forecast ?? [],
  );

  return (
    <SiteFrame split pulse>
      <LandingScroll>
        <section className="landing-band-dark grid h-dvh snap-start snap-always grid-cols-[var(--site-gutter)_minmax(0,1fr)_var(--site-gutter)] border-b border-separator lg:grid-cols-[var(--site-gutter)_minmax(0,1fr)_minmax(0,1fr)_var(--site-gutter)]">
          <div className="col-start-1 row-span-2 lg:row-span-1" />
          <div className="relative col-start-2 h-full min-h-0">
            <div className="hero-dither pointer-events-none absolute inset-0 overflow-hidden">
              <PulseHeroDither />
            </div>
          </div>
          <div className="col-start-2 flex h-full items-center px-6 py-10 sm:px-10 lg:col-start-3">
            <div className="flex w-full flex-col gap-10 sm:gap-12">
              <HeroAccess />
              <p className="max-w-xl text-[17px] leading-[1.6] text-ink-secondary">
                Cada mes: cómo está y hacia dónde va
              </p>
            </div>
          </div>
          <div className="col-start-3 row-span-2 lg:col-start-4 lg:row-span-1" />
        </section>
        <LandingShowcase
          points={trajectory.points}
          boundaryIndex={trajectory.boundaryIndex}
        />
        <LandingFooter />
      </LandingScroll>
    </SiteFrame>
  );
}
