import { describe, expect, it } from 'vitest';

import { buildVariableRows } from '@/lib/pulse/company-view';
import { buildPointsExample } from '@/lib/pulse/points-example';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';

const source = new StaticPulseSource();
const { meta } = await source.getSummary();
const company = await source.getCompany('COMP_0001');
const lastClose = company?.series[company.series.length - 1] ?? null;

describe('buildPointsExample', () => {
  it('works the formula through on the heaviest contributor of the close', () => {
    const rows = buildVariableRows(meta.variables, lastClose, {});
    const example = buildPointsExample(rows);
    const best = [...rows]
      .filter((row) => row.known)
      .sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0))[0];

    expect(example).not.toBeNull();
    expect(example?.reading).toContain(best.label);
    expect(example?.reading).toContain('que en la cartera puntúa');
    expect(example?.arithmetic).toContain('puntos de PULSE');
    expect(example?.arithmetic).toContain('=');
    expect(example?.ceiling).toContain('Su techo son');
    expect(example?.ceiling).toContain('score de 100');
    for (const line of Object.values(example ?? {})) {
      expect(line).not.toContain('NaN');
      expect(line).not.toContain('—');
    }
  });

  it('divides by the weight with data, not by the hundred points', () => {
    const rows = buildVariableRows(meta.variables, lastClose, {});
    const known = rows.filter((row) => row.known);
    const weight = known.reduce((total, row) => total + row.weight, 0);
    const example = buildPointsExample(rows);

    expect(weight).toBeLessThan(100);
    expect(example?.arithmetic).toContain(`/ ${weight}`);
  });

  it('returns nothing when the month measured no variable', () => {
    expect(
      buildPointsExample(buildVariableRows(meta.variables, null, {})),
    ).toBe(null);
    expect(buildPointsExample([])).toBe(null);
  });
});
