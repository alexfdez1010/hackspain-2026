import { Ar90Detail } from '@/components/pulse/variable/detail/ar90-detail';
import { CashDaysDetail } from '@/components/pulse/variable/detail/cash-days-detail';
import { CashMinDetail } from '@/components/pulse/variable/detail/cash-min-detail';
import { DpoDetail } from '@/components/pulse/variable/detail/dpo-detail';
import { DsoDetail } from '@/components/pulse/variable/detail/dso-detail';
import { LocAccelDetail } from '@/components/pulse/variable/detail/loc-accel-detail';
import { LocUtilDetail } from '@/components/pulse/variable/detail/loc-util-detail';
import { MaturitiesDetail } from '@/components/pulse/variable/detail/maturities-detail';
import { NetworkDetail } from '@/components/pulse/variable/detail/network-detail';
import { TermsDetail } from '@/components/pulse/variable/detail/terms-detail';
import { TopClientDetail } from '@/components/pulse/variable/detail/top-client-detail';
import type { PulseCompanyDetails } from '@/lib/pulse/details/types';

interface PulseVariableDetailProps {
  /** Variable key of the export, such as `network`. */
  variableKey: string;
  /** Detail of the company for its last observed month. */
  details: PulseCompanyDetails;
}

/**
 * Renders the drill-down of one variable: the counterparties, the accounts,
 * the credit lines or the daily cash that produced the figure of the month.
 *
 * Each variable gets its own reading rather than a generic table, because
 * what explains a DPO is a supplier and what explains the exposure is a
 * customer whose payment health is moving.
 *
 * @param props - The variable to read and the detail of the company.
 * @returns The matching drill-down, or `null` for a key with no block.
 */
export function PulseVariableDetail({
  variableKey,
  details,
}: PulseVariableDetailProps) {
  const { variables, month } = details;
  switch (variableKey) {
    case 'cash_days':
      return <CashDaysDetail block={variables.cash_days} month={month} />;
    case 'cash_min':
      return <CashMinDetail block={variables.cash_min} month={month} />;
    case 'loc_util':
      return <LocUtilDetail block={variables.loc_util} month={month} />;
    case 'loc_accel':
      return <LocAccelDetail block={variables.loc_accel} />;
    case 'dpo':
      return <DpoDetail block={variables.dpo} month={month} />;
    case 'terms':
      return <TermsDetail block={variables.terms} month={month} />;
    case 'dso':
      return <DsoDetail block={variables.dso} month={month} />;
    case 'ar90':
      return <Ar90Detail block={variables.ar90} month={month} />;
    case 'top_client':
      return <TopClientDetail block={variables.top_client} />;
    case 'maturities':
      return <MaturitiesDetail block={variables.maturities} month={month} />;
    case 'network':
      return <NetworkDetail block={variables.network} month={month} />;
    default:
      return null;
  }
}
