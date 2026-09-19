import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { AssistantWidget } from '@/components/assistant/assistant-widget';
import { SiteNav } from '@/components/layout/site-nav';
import { getAssistantMode } from '@/lib/assistant/config';
import { buildCompanyOptions } from '@/lib/company/options';
import { getPulseDataSource } from '@/lib/pulse/data';

/** Resolve assistant credentials at request time, including keys added after a build. */
export const dynamic = 'force-dynamic';

/**
 * Product chrome: nav and Nexo only on company and method routes, not `/`.
 *
 * The navigation needs every company of the export to offer the selector, so
 * the summary is read here once per request instead of on every page.
 *
 * @param props - Nested product pages.
 * @returns The nav, the routed page and the assistant.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { companies } = await getPulseDataSource().getSummary();
  const options = buildCompanyOptions(companies.map((row) => row.companyId));
  return (
    <>
      <Suspense fallback={null}>
        <SiteNav companies={options} />
      </Suspense>
      {children}
      <AssistantWidget mode={getAssistantMode()} />
    </>
  );
}
