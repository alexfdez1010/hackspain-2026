'use client';

import {
  CompanyActionsPending,
  CompanyActionsView,
} from '@/components/actions/company-actions-view';
import { useCompanyActions } from '@/components/actions/use-company-actions';
import type { CompanySection } from '@/lib/routes';

export { ACTIONS_TITLE } from '@/components/actions/company-actions-view';

interface CompanyActionsSectionProps {
  companyId: string;
  /** Last observed month of the company, as `YYYY-MM`. */
  month: string;
  current: CompanySection;
}

/**
 * The actions block pages drop in: it renders pending on the server, then in
 * the browser reads its own copy of the actions or asks the server for them.
 *
 * @param props - Company, its close and the section.
 * @returns The block, pending or filled.
 */
export function CompanyActionsSection({
  companyId,
  month,
  current,
}: CompanyActionsSectionProps) {
  const state = useCompanyActions(companyId, month);
  if (state.status === 'loading') return <CompanyActionsPending />;
  return (
    <CompanyActionsView
      result={state.result}
      companyId={companyId}
      current={current}
    />
  );
}
