'use client';

import { useRef, type ReactNode } from 'react';

import { usePagedScroll } from '@/components/layout/use-paged-scroll';

/**
 * Full-viewport scroller for the marketing landing.
 *
 * Children must be `h-dvh` bands. Paging is owned by `usePagedScroll`.
 *
 * @param props - Band nodes to page through.
 * @returns The landing `<main>` scroller.
 */
export function LandingScroll({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  usePagedScroll(ref);

  return (
    <main
      ref={ref}
      data-landing-snap
      className="h-dvh overflow-y-scroll overscroll-y-none"
    >
      {children}
    </main>
  );
}
