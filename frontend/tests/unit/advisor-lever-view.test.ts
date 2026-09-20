import { describe, expect, it } from 'vitest';

import {
  buildLeverHeadline,
  buildLeverTiles,
  cheapestOffer,
  pillarPhrase,
} from '@/lib/advisor/lever-view';
import { StaticAdvisorSource } from '@/lib/advisor/source/static-json';
import type { AdvisorCompany } from '@/lib/advisor/types';

const source = new StaticAdvisorSource();

/**
 * Reads a company of the bundled export, failing loudly when it is missing.
 *
 * @param id - Company identifier.
 * @returns The advisor answer of the company.
 */
async function load(id: string): Promise<AdvisorCompany> {
  const company = await source.getCompany(id);
  if (!company) throw new Error(`missing company ${id}`);
  return company;
}

describe('pillarPhrase', () => {
  it('drops the «Pilar» prefix and lowers the case', () => {
    expect(pillarPhrase('Pilar liquidez')).toBe('liquidez');
    expect(pillarPhrase('Deuda y servicio')).toBe('deuda y servicio');
  });
});

describe('buildLeverHeadline', () => {
  it('writes the counterfactual of COMP_0001 with its figures', async () => {
    const view = buildLeverHeadline(await load('COMP_0001'));
    expect(view?.headline).toMatch(
      /^Con el pilar de liquidez en \d+ en vez de \d+, tu prima de riesgo baja 395 puntos básicos\.$/,
    );
    expect(view?.note).toContain('pasa del 28\u00a0% al 7\u00a0%');
    expect(view?.tiles.map((tile) => tile.key)).toEqual([
      'stress',
      'fit',
      'rate',
    ]);
  });

  it('frames the price with the stress, the fit and the best rate', async () => {
    const company = await load('COMP_0001');
    const [stress, fit, rate] = buildLeverTiles(company);
    expect(stress.value).toBe('28\u00a0%');
    expect(stress.tip).toContain('La media de la cartera es');
    expect(fit.value).toBe('3 de 7');
    expect(rate.value).toBe('5,65\u00a0%');
    expect(rate.label).toContain('+355 pb sobre Euríbor 12 m');
    expect(rate.tone).toBe('sky');
    expect(cheapestOffer(company.recommendations)?.product).toBe(
      company.recommendations.find((offer) => offer.annualRate === 0.0565)
        ?.product,
    );
  });

  it('says there is no rate when nothing is offered', async () => {
    const company = await load('COMP_0007');
    const [, fit, rate] = buildLeverTiles(company);
    expect(fit.value).toMatch(/^0 de \d+$/);
    expect(rate.value).toBe('—');
    expect(rate.tone).toBe('plain');
    expect(cheapestOffer([])).toBeNull();
  });

  it('renders nothing when no lever lowers the premium', async () => {
    const company = await load('COMP_0001');
    const flat: AdvisorCompany = {
      ...company,
      improvementPlan: { ...company.improvementPlan, levers: [] },
    };
    expect(buildLeverHeadline(flat)).toBeNull();
  });
});
