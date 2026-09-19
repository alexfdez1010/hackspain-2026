import { HeroAccess } from '@/components/layout/hero-access';
import { LandingFooter } from '@/components/layout/landing-footer';
import { LandingScroll } from '@/components/layout/landing-scroll';
import { PulseHeroMark } from '@/components/layout/pulse-hero-mark';
import { SiteFrame } from '@/components/layout/site-frame';

/**
 * Marketing landing: three viewport-tall bands inside the site frame.
 *
 * The hero splits branding and product access. The middle band is an empty
 * placeholder. The footer is lists and legal in the right pane only.
 *
 * @returns The framed landing page.
 */
export default function LandingPage() {
  return (
    <SiteFrame split pulse>
      <LandingScroll>
        <section className="grid h-dvh snap-start snap-always grid-cols-[var(--site-gutter)_minmax(0,1fr)_var(--site-gutter)] border-b border-separator lg:grid-cols-[var(--site-gutter)_minmax(0,1fr)_minmax(0,1fr)_var(--site-gutter)]">
          <div className="col-start-1 row-span-2 lg:row-span-1" />
          <div className="col-start-2 flex items-center px-6 py-10 sm:px-10">
            <h1 className="sr-only">Embat Pulse</h1>
            <PulseHeroMark />
          </div>
          <div className="col-start-2 flex h-full items-center px-6 py-10 sm:px-10 lg:col-start-3">
            <HeroAccess />
          </div>
          <div className="col-start-3 row-span-2 lg:col-start-4 lg:row-span-1" />
        </section>
        <div className="h-dvh snap-start snap-always border-b border-separator" />
        <LandingFooter />
      </LandingScroll>
    </SiteFrame>
  );
}
