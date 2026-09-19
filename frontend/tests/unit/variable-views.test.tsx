import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PulseVariableDefinition } from '@/components/pulse/variable/variable-definition';
import { PulseVariableHeader } from '@/components/pulse/variable/variable-header';
import { PulseVariableMonthTable } from '@/components/pulse/variable/variable-month-table';
import { PulseVariableNav } from '@/components/pulse/variable/variable-nav';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import { buildVariableStats } from '@/lib/pulse/variable-series';
import {
  buildVariableView,
  findVariable,
  orderedVariables,
  type PulseVariableView,
} from '@/lib/pulse/variable-view';

const { meta } = await new StaticPulseSource().getSummary();
const company = await new StaticPulseSource().getCompany('COMP_0051');
const variable = findVariable(meta, 'loc_util')!;
const view = buildVariableView(company!, meta, variable)!;

/**
 * Builds a view whose eleven months carry no evidence at all.
 *
 * @returns A view of `loc_util` with an entirely unknown series.
 */
function unknownView(): PulseVariableView {
  const points = view.points.map((point) => ({
    ...point,
    score: null,
    raw: null,
    contribution: null,
    change: null,
    known: false,
  }));
  return {
    ...view,
    points,
    last: points[points.length - 1],
    stats: buildVariableStats(points),
  };
}

describe('buildVariableView', () => {
  it('reads the whole observed history of the variable', () => {
    expect(view.companyId).toBe('COMP_0051');
    expect(view.pillar.key).toBe('deuda');
    expect(view.points).toHaveLength(24);
    expect(view.stats.total).toBe(24);
    expect(view.shareOfPillar).toBeCloseTo(12 / 26);
    expect(view.previous?.key).toBe('cash_min');
    expect(view.next?.key).toBe('loc_accel');
  });
});

describe('the variable header', () => {
  it('shows the last close, its value and the points it contributes', () => {
    const markup = renderToStaticMarkup(<PulseVariableHeader view={view} />);
    expect(markup).toContain('Score de Utilización de líneas en');
    expect(markup).toContain('Más bajo, más sano');
    expect(markup).toContain('de 12 pts');
    expect(markup).toContain('Aporte al PULSE');
    expect(markup).toContain('24 de 24');
    expect(markup).not.toContain('NaN');
  });

  it('never turns a series without evidence into a zero', () => {
    const markup = renderToStaticMarkup(
      <PulseVariableHeader view={unknownView()} />,
    );
    expect(markup).toContain('sin datos');
    expect(markup).toContain('0 de 24');
    expect(markup).toContain('Sin mes anterior con datos');
    expect(markup).toContain('—');
    expect(markup).not.toContain('NaN');
  });
});

describe('the variable navigation', () => {
  it('groups the eleven variables by pillar and marks the open one', () => {
    const markup = renderToStaticMarkup(
      <PulseVariableNav
        companyId="COMP_0051"
        variables={meta.variables}
        currentKey="loc_util"
        pillars={meta.pillars}
      />,
    );
    for (const item of orderedVariables(meta.variables)) {
      expect(markup).toContain(`/company/COMP_0051/variable/${item.key}`);
    }
    expect(markup).toContain('Liquidez');
    expect(markup).toContain('Deuda y servicio');
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
  });
});

describe('the variable definition', () => {
  it('states the direction, the origin and the weight of the variable', () => {
    const markup = renderToStaticMarkup(
      <PulseVariableDefinition view={view} />,
    );
    expect(markup).toContain('Dispuesto entre límite');
    expect(markup).toContain('Más bajo, más sano');
    expect(markup).toContain('% del límite');
    expect(markup).toContain('12 de 100 puntos');
    expect(markup).toContain('del pilar Deuda y servicio (26 pts)');
    expect(markup).toContain('Variable 3 de la especificación');
  });

  it('keeps the weight rows when the method does not document the variable', () => {
    const markup = renderToStaticMarkup(
      <PulseVariableDefinition view={{ ...view, doc: null }} />,
    );
    expect(markup).toContain('El método aún no documenta esta variable');
    expect(markup).toContain('12 de 100 puntos');
    expect(markup).not.toContain('Dirección');
    expect(markup).not.toContain('Origen');
  });
});

describe('the variable month table', () => {
  it('prints every month with its score, value and contribution', () => {
    const markup = renderToStaticMarkup(
      <PulseVariableMonthTable points={view.points} unit={variable.unit} />,
    );
    expect(markup).toContain('sep 2024');
    expect(markup).toContain('ago 2026');
    expect(markup).toContain('12,19 pts');
    expect(markup).not.toContain('NaN');
  });

  it('marks every month as «sin datos» when nothing was measured', () => {
    const markup = renderToStaticMarkup(
      <PulseVariableMonthTable
        points={unknownView().points}
        unit={variable.unit}
      />,
    );
    expect(markup).toContain('sin datos');
    expect(markup).not.toContain('NaN');
  });

  it('explains the empty table instead of drawing an empty grid', () => {
    const markup = renderToStaticMarkup(
      <PulseVariableMonthTable points={[]} unit="días" />,
    );
    expect(markup).toContain('Sin meses observados');
  });
});
