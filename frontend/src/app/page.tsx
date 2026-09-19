import { redirect } from 'next/navigation';

import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { companyRoutes } from '@/lib/routes';

/**
 * Root of the app: there is no portfolio and no entry page, so the reader lands
 * on the PULSE of the demo company and switches company from the navigation.
 *
 * @returns Never; the request is redirected to the demo company.
 */
export default function RootPage(): never {
  redirect(companyRoutes(PULSE_DEMO_COMPANY_ID).pulse);
}
