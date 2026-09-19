import {
  isLoadError,
  round,
  type ToolRuntime,
} from '@/lib/assistant/tools/context';

/**
 * Reads the recommended products of the company, their price and why.
 *
 * Every figure the recommendation page prints is here: the offers with the
 * decomposition of their rate, the products left out and the levers that
 * would unlock one, so the model can answer «why this price» with the
 * published components instead of guessing.
 *
 * @param runtime - Tool runtime of the request.
 * @returns The recommendation, or the reason there is none.
 */
export async function readFinancing(runtime: ToolRuntime) {
  const loaded = await runtime.loadCompany();
  if (isLoadError(loaded)) return loaded;
  const advisor = await runtime.loadAdvisor();
  if (!advisor) {
    return {
      company: loaded.name,
      error: 'No hay recomendaciones publicadas para esta empresa.',
    };
  }
  return {
    company: loaded.name,
    month: advisor.month,
    summary: advisor.summary,
    pStress6m: round(advisor.risk.pStress6m, 2),
    baseRate: round(advisor.risk.baseRate, 2),
    riskDrivers: advisor.risk.contributions
      .filter((item) => item.logit !== null)
      .sort((a, b) => Math.abs(b.logit ?? 0) - Math.abs(a.logit ?? 0))
      .slice(0, 5)
      .map((item) => ({
        label: item.label,
        value: round(item.value, 2),
        logit: round(item.logit, 2),
      })),
    referenceRate: {
      label: advisor.referenceRate.label,
      value: round(advisor.referenceRate.value, 4),
    },
    inputs: {
      cashEnd: round(advisor.inputs.cashEnd, 0),
      monthlyOutflow: round(advisor.inputs.monthlyOutflow, 0),
      monthlyCollections: round(advisor.inputs.monthlyCollections, 0),
      openReceivables: round(advisor.inputs.invoices.openAr, 0),
      openPayables: round(advisor.inputs.invoices.openAp, 0),
      lineLimit: round(advisor.inputs.holdings.lineLimit, 0),
      lineDrawn: round(advisor.inputs.holdings.lineDrawn, 0),
      loanOutstanding: round(advisor.inputs.holdings.loanOutstanding, 0),
    },
    offers: advisor.recommendations.map((offer) => ({
      rank: offer.rank,
      label: offer.label,
      family: offer.family,
      what: offer.what,
      headline: offer.headline,
      fit: round(offer.fit),
      amount: round(offer.amount, 0),
      tenorMonths: offer.tenorMonths,
      monthlyInstalment: round(offer.monthlyInstalment, 0),
      rateKind: offer.rateKind,
      annualRate: round(offer.annualRate, 4),
      spreadBps: offer.spreadBps,
      priceComponents: offer.pricing.components.map((component) => ({
        label: component.label,
        bps: component.bps,
        detail: component.detail,
      })),
      why: offer.why,
      sizing: offer.sizing.formula,
      leverStory: offer.leverStory,
    })),
    declined: advisor.declined.map((item) => ({
      label: item.label,
      status: item.status,
      fit: round(item.fit),
      reasons: item.reasons,
    })),
    unlocks: advisor.improvementPlan.unlocks,
    levers: advisor.improvementPlan.levers.map((lever) => ({
      pillar: lever.label,
      current: round(lever.current),
      target: round(lever.target),
      pStressNow: round(lever.pStressNow, 2),
      pStressThen: round(lever.pStressThen, 2),
      premiumSavingBps: lever.premiumSavingBps,
    })),
    disclaimer: advisor.disclaimer,
  };
}
