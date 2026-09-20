import Image from 'next/image';
import Link from 'next/link';

import { PulseWordmark } from '@/components/ui/wordmark';
import { PRODUCT_TAGLINE } from '@/lib/brand';

/**
 * The bar over the hero: the same mark and height as the product nav, with
 * the claim of the product instead of the company search.
 *
 * It sits inside the hero band so it takes the band's ink and never covers
 * the light band or the footer. The hairline under it is the product's.
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
          {PRODUCT_TAGLINE}
        </p>
      </div>
    </header>
  );
}
