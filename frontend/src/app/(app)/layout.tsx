import type { ReactNode } from 'react';

import { SiteNav } from '@/components/layout/site-nav';

/**
 * Product chrome: the section nav is only on dashboard routes, not the landing.
 *
 * @param props - Nested product pages.
 * @returns The nav and the routed page.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}
