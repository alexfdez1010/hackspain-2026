import {
  getAdvisorDataSource,
  type AdvisorDataSource,
} from '@/lib/advisor/data';
import { companyName } from '@/lib/company/names';
import { getPulseDataSource, type PulseDataSource } from '@/lib/pulse/data';
import { monthlyChange } from '@/lib/pulse/selectors';
import { activeSignal } from '@/lib/pulse/signals';
import { companyIdFromPath, companyRoutes } from '@/lib/routes';
import type { ToolContext } from '@/lib/assistant/tools/context';
import { getPageLabel, type AssistantSource } from '@/lib/assistant/types';

/** What the model may know about the company's recommended products. */
function advisorSnapshot(
  advisor: Awaited<ReturnType<AdvisorDataSource['getCompany']>>,
) {
  if (!advisor) return null;
  return {
    summary: advisor.summary,
    pStress6m: advisor.risk.pStress6m,
    baseRate: advisor.risk.baseRate,
    referenceRate: advisor.referenceRate,
    offers: advisor.recommendations.map((offer) => ({
      rank: offer.rank,
      label: offer.label,
      headline: offer.headline,
      fit: offer.fit,
      amount: offer.amount,
      annualRate: offer.annualRate,
      rateKind: offer.rateKind,
      spreadBps: offer.spreadBps,
      why: offer.why,
    })),
    declined: advisor.declined.map((item) => ({
      label: item.label,
      status: item.status,
      reasons: item.reasons,
    })),
    unlocks: advisor.improvementPlan.unlocks,
    leverStory:
      advisor.recommendations[0]?.leverStory ?? advisor.improvementPlan.story,
  };
}

/**
 * Builds a small, server-owned snapshot using the same adapters as the pages.
 *
 * The app is company-scoped, so only the score metadata and, when the page or
 * the question names one, a single company with its recommendations cross the
 * boundary: the model never receives the portfolio.
 *
 * @param pathname - Current application path, already validated.
 * @param question - Last user message, scanned for a company identifier.
 * @param pulse - PULSE data source; injected in tests.
 * @param advisor - Advisor data source; injected in tests.
 * @returns The snapshot serialised into the system prompt.
 */
export async function getAssistantContext(
  pathname: string,
  question: string,
  pulse: Pick<
    PulseDataSource,
    'kind' | 'getSummary' | 'getCompany'
  > = getPulseDataSource(),
  advisor: Pick<AdvisorDataSource, 'getCompany'> = getAdvisorDataSource(),
) {
  const companyId =
    question.match(/\bCOMP_\d{4}\b/i)?.[0].toUpperCase() ??
    companyIdFromPath(pathname) ??
    undefined;
  const [summary, company, recommendation] = await Promise.all([
    pulse.getSummary(),
    companyId ? pulse.getCompany(companyId) : null,
    companyId ? advisor.getCompany(companyId) : null,
  ]);
  const sources: AssistantSource[] = [{ label: 'Método', href: '/method' }];
  if (company) {
    const routes = companyRoutes(company.companyId);
    sources.unshift(
      {
        label: `PULSE · ${companyName(company.companyId)}`,
        href: routes.pulse,
      },
      { label: 'Alertas', href: routes.signals },
      { label: 'Financiación', href: routes.advisor },
    );
  }
  const last = company?.series[company.series.length - 1] ?? null;
  return {
    page: getPageLabel(pathname),
    sources,
    companyId,
    provenance:
      pulse.kind === 'static' ? 'Dataset local PULSE' : 'Servicio PULSE',
    month: summary.meta.lastMonth,
    scoreName: summary.meta.scoreName,
    horizons: summary.meta.horizons,
    pillars: summary.meta.pillars,
    variables: summary.meta.variables,
    company: company
      ? {
          id: company.companyId,
          name: companyName(company.companyId),
          month: company.month,
          firstMonth: company.series[0]?.month ?? null,
          monthsObserved: company.monthsObserved,
          pulse: company.pulse,
          pulsePrev: company.pulsePrev,
          change: monthlyChange(company),
          confidence: company.confidence,
          pillars: company.pillars,
          unknownVariables: last
            ? Object.entries(last.variables)
                .filter(([, value]) => !value.known)
                .map(([key]) => key)
            : [],
          forecast: company.forecast,
          signals: company.signals.map((signal) => ({
            month: signal.month,
            kind: signal.kind,
            move: signal.move,
            drivers: signal.drivers.map((d) => `${d.label} ${d.delta}`),
            pPersistent: signal.pPersistent,
            outcome: signal.outcome,
            headline: signal.headline,
          })),
          activeSignal: activeSignal(company)?.headline ?? null,
        }
      : null,
    advisor: advisorSnapshot(recommendation),
  };
}

export type AssistantContext = Awaited<ReturnType<typeof getAssistantContext>>;

/**
 * The tool context of a request: the same company and adapters the snapshot
 * used, so the tools and the evidence never disagree.
 *
 * @param context - Snapshot built by {@link getAssistantContext}.
 * @param pulse - PULSE data source; injected in tests.
 * @param advisor - Advisor data source; injected in tests.
 * @returns The context for `createAssistantTools`.
 */
export function assistantToolContext(
  context: AssistantContext,
  pulse: Pick<
    PulseDataSource,
    'getCompany' | 'getCompanyDetails'
  > = getPulseDataSource(),
  advisor: Pick<AdvisorDataSource, 'getCompany'> = getAdvisorDataSource(),
): ToolContext {
  return {
    companyId: context.companyId,
    meta: { pillars: context.pillars, variables: context.variables },
    sources: { pulse, advisor },
  };
}
