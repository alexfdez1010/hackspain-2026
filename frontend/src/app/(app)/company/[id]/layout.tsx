import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { getPulseDataSource } from '@/lib/pulse/data';

interface CompanyLayoutProps {
  params: Promise<{ id: string }>;
  children: ReactNode;
}

/**
 * Guards every page of a company: an identifier the export does not know
 * answers 404 here, above the loading boundary of the pages.
 *
 * The pages call `notFound()` themselves too, but once `loading.tsx` has
 * streamed its shell the response is already a 200; resolving the company
 * in the layout, which renders before that boundary, keeps the status code
 * right. The read is memoised, so the page's own read costs nothing more.
 *
 * @param props - Route parameters and the routed page.
 * @returns The page, or a 404 when the company is unknown.
 */
export default async function CompanyLayout({
  params,
  children,
}: CompanyLayoutProps) {
  const { id } = await params;
  const company = await getPulseDataSource().getCompany(id);
  if (!company) notFound();
  return children;
}
