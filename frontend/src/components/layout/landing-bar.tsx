import Image from 'next/image';
import Link from 'next/link';

import { PulseWordmark } from '@/components/ui/wordmark';

/** Tagline of the prototype header, beside the mark. */
export const LANDING_TAGLINE = 'La inteligencia que impulsa tu tesorería';

/**
 * The bar over the hero: the same mark and height as the product nav, with
 * the tagline of the prototype instead of the company search.
 *
 * It sits inside the hero band so it takes the band's ink and never covers
 * the light band or the footer. The hairline is full width. The mark sits
 * on the same 1240 px row as the product nav and page shell, so landing and
 * the app share one left edge.
 *
 * @returns The landing header.
 */
export function LandingBar() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 border-b border-separator">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 py-2 sm:px-8 lg:py-4">
        <Link
          href="/"
          aria-label="Embat Pulse, inicio"
          className="flex h-11 shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Image src="/icon.svg" alt="" width={40} height={40} unoptimized />
          <PulseWordmark className="h-3.5" />
        </Link>
        <p className="hidden border-l border-separator pl-4 text-[15px] leading-none text-muted sm:block">
          {LANDING_TAGLINE}
        </p>
      </div>
    </header>
  );
}
