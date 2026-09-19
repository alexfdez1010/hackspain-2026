import { redirect } from 'next/navigation';

import { companyRoutes } from '@/lib/routes';

interface LegacyCompanyPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Legacy company route, kept so links written before the app became
 * company-scoped keep working.
 *
 * @param props - Route parameters carrying the company identifier.
 * @returns Never; the request is redirected to the company's PULSE page.
 */
export default async function LegacyCompanyPage({
  params,
}: LegacyCompanyPageProps) {
  const { id } = await params;
  redirect(companyRoutes(id).pulse);
}
