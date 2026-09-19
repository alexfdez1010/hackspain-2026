import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { VariableContributionChart } from '@/components/charts/variable/variable-contribution-chart';
import { VariableForecastChart } from '@/components/charts/variable/variable-forecast-chart';
import { VariableRawChart } from '@/components/charts/variable/variable-raw-chart';
import { VariableScoreChart } from '@/components/charts/variable/variable-score-chart';
import { VariableStandingBars } from '@/components/charts/variable/variable-standing-bars';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import type { PulseCompany } from '@/lib/pulse/types';
import { buildVariableForecast } from '@/lib/pulse/variable-forecast';
import {
  buildVariableView,
  findVariable,
  type PulseVariableView,
} from '@/lib/pulse/variable-view';

/**
 * Replaces the narrow no-break spaces `Intl` inserts before a unit.
 *
 * @param markup - Rendered markup.
 * @returns The same markup with plain spaces, so assertions stay readable.
 */
function plain(markup: string): string {
  return markup.replace(/\u00a0/g, ' ');
}

const source = new StaticPulseSource();
const { meta } = await source.getSummary();
const first = await source.getCompany('COMP_0001');
const long = await source.getCompany('COMP_0051');

/**
 * Builds the view of one variable of one company from the bundled export.
 *
 * @param company - Company read from the static source.
 * @param key - Variable key such as `cash_days`.
 * @returns The view the chart components read.
 */
function view(company: PulseCompany | null, key: string): PulseVariableView {
  const variable = findVariable(meta, key);
  const built =
    company && variable ? buildVariableView(company, meta, variable) : null;
  if (!built) throw new Error(`Sin vista para ${key}`);
  return built;
}

const cash = view(first, 'cash_days');
const topClient = view(first, 'top_client');
const unknown = view(first, 'loc_util');
const locUtil = view(long, 'loc_util');

describe('VariableScoreChart', () => {
  it('draws the score of the variable with its pillar and the PULSE', () => {
    const markup = renderToStaticMarkup(
      <VariableScoreChart
        points={cash.points}
        label={cash.variable.label}
        pillarLabel={cash.pillar.label}
      />,
    );
    expect(markup).toContain('role="img"');
    expect(markup).toContain(
      'aria-label="Días de caja: score mensual desde ene 2026 hasta ago 2026; último valor 39,0 sobre 100"',
    );
    expect(markup).toContain('>39,0</text>');
    expect(markup).toContain('Línea continua: Días de caja.');
    expect(markup).toContain('Discontinua: Liquidez.');
    expect(markup).toContain('Punteada: PULSE.');
    expect(markup).not.toContain('NaN');
  });

  it('breaks the line over the months without evidence', () => {
    const markup = renderToStaticMarkup(
      <VariableScoreChart
        points={topClient.points}
        label={topClient.variable.label}
        pillarLabel={topClient.pillar.label}
      />,
    );
    const line = markup.match(/stroke-width="2.2"/g) ?? [];
    expect(line).toHaveLength(1);
    expect(markup).toContain('>34,0</text>');
    expect(markup).not.toContain('NaN');
  });

  it('says so when no month carries a score', () => {
    const markup = renderToStaticMarkup(
      <VariableScoreChart
        points={unknown.points}
        label={unknown.variable.label}
        pillarLabel={unknown.pillar.label}
      />,
    );
    expect(markup).toContain('Sin meses con datos para esta variable.');
  });
});

describe('VariableRawChart', () => {
  it('prints the last figure in the unit and reads the direction', () => {
    const markup = renderToStaticMarkup(
      <VariableRawChart
        points={cash.points}
        unit={cash.variable.unit}
        better={cash.doc?.better ?? null}
        label={cash.variable.label}
      />,
    );
    expect(markup).toContain('role="img"');
    expect(markup).toContain('último valor 14,0 días');
    expect(markup).toContain('>14,0 días</text>');
    expect(markup).toContain('Cifra en días.');
    expect(markup).toContain('Más alto, más sano.');
    expect(markup).not.toContain('NaN');
  });

  it('keeps the negatives and draws the zero axis', () => {
    const markup = renderToStaticMarkup(
      <VariableRawChart
        points={topClient.points}
        unit={topClient.variable.unit}
        better={topClient.doc?.better ?? null}
        label={topClient.variable.label}
      />,
    );
    expect(plain(markup)).toContain('37,0 % vs trimestre anterior');
    expect(markup).toContain('stroke="var(--foreground)"');
    expect(markup.match(/stroke-dasharray="4 3"/g)).toHaveLength(3);
    expect(markup).not.toContain('NaN');
  });

  it('reads a share as a percentage on the axis', () => {
    const markup = renderToStaticMarkup(
      <VariableRawChart
        points={locUtil.points}
        unit={locUtil.variable.unit}
        better={locUtil.doc?.better ?? null}
        label={locUtil.variable.label}
      />,
    );
    expect(plain(markup)).toContain('58,0 % del límite');
    expect(markup).toContain('Más bajo, más sano.');
  });

  it('says so when no month carries a figure', () => {
    const markup = renderToStaticMarkup(
      <VariableRawChart
        points={unknown.points}
        unit={unknown.variable.unit}
        better={unknown.doc?.better ?? null}
        label={unknown.variable.label}
      />,
    );
    expect(markup).toContain('Sin meses con datos para esta variable.');
  });
});

describe('VariableContributionChart', () => {
  it('shows the points earned against the weight of the variable', () => {
    const markup = renderToStaticMarkup(
      <VariableContributionChart
        points={locUtil.points}
        weight={locUtil.variable.weight}
        label={locUtil.variable.label}
      />,
    );
    expect(markup).toContain('máximo: 12 pts');
    expect(markup).toContain('>2,19 pts</text>');
    expect(markup).toContain('de un máximo de 12 puntos');
    expect(markup).not.toContain('NaN');
  });

  it('says so when the variable never contributed', () => {
    const markup = renderToStaticMarkup(
      <VariableContributionChart
        points={unknown.points}
        weight={unknown.variable.weight}
      />,
    );
    expect(markup).toContain('Sin meses con datos para esta variable.');
  });
});

describe('VariableForecastChart', () => {
  it('prints the signed contribution of every horizon and the total', () => {
    const markup = renderToStaticMarkup(
      <VariableForecastChart forecast={cash.forecast} />,
    );
    expect(markup).toContain('+1 m');
    expect(markup).toContain('sep 2026');
    expect(markup).toContain('+0,87');
    expect(markup).toContain('var(--score-solid)');
    expect(markup).toContain('cambio total previsto del PULSE');
  });

  it('marks a horizon the model does not decompose', () => {
    const forecast = buildVariableForecast(first?.forecast ?? [], 'inventado');
    const markup = renderToStaticMarkup(
      <VariableForecastChart forecast={forecast} />,
    );
    expect(markup).toContain('sin datos');
  });

  it('says so without a published forecast', () => {
    const markup = renderToStaticMarkup(
      <VariableForecastChart
        forecast={buildVariableForecast([], 'cash_days')}
      />,
    );
    expect(markup).toContain('Sin previsión publicada para esta empresa.');
  });
});

describe('VariableStandingBars', () => {
  it('links to the sibling variables and never to the current one', () => {
    const markup = renderToStaticMarkup(
      <VariableStandingBars standing={cash.standing} companyId="COMP_0001" />,
    );
    expect(markup).toContain('href="/company/COMP_0001/variable/ar90"');
    expect(markup).toContain('href="/company/COMP_0001/variable/network"');
    expect(markup).not.toContain(
      'href="/company/COMP_0001/variable/cash_days"',
    );
    expect(markup).toContain('Días de caja');
    expect(markup).toContain('font-semibold');
  });

  it('leaves the unmeasured variables without a bar', () => {
    const markup = renderToStaticMarkup(
      <VariableStandingBars standing={cash.standing} companyId="COMP_0001" />,
    );
    expect(markup).toContain('sin datos');
    expect(markup).toContain('Utilización de líneas');
  });
});
