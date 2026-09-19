import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PulseGapTable } from '@/components/pulse/gap-table';
import { PulseHeadlineTotal } from '@/components/pulse/headline-total';
import { PulsePlanPanel } from '@/components/pulse/plan-panel';
import { buildPulseGapBoard } from '@/lib/pulse/gap';
import type { PulseMosaic, PulseMosaicCell } from '@/lib/pulse/mosaic';
import { PLANS } from '@/lib/pulse/plans';
import { scoreBand } from '@/lib/score';

/**
 * Builds one cell of a month.
 *
 * @param key - Variable key.
 * @param label - Variable label.
 * @param weight - Points of the 100 owned by the variable.
 * @param score - Score of the month; `null` means no evidence.
 * @returns The cell as the mosaic lays it out.
 */
function makeCell(
  key: string,
  label: string,
  weight: number,
  score: number | null,
): PulseMosaicCell {
  return {
    key,
    label,
    pillar: 'liquidez',
    pillarLabel: 'Liquidez',
    weight,
    score,
    known: score !== null,
    band: scoreBand(score),
    rawValue: 5,
    unit: 'días',
    contribution: null,
  };
}

const MOSAIC: PulseMosaic = {
  columns: [],
  cells: [
    makeCell('cash_min', 'Mínimo intramensual de caja', 30, 20),
    makeCell('dso', 'Días de cobro', 20, 60),
    makeCell('ar90', 'Cartera vencida', 10, 40),
    makeCell('loc_util', 'Utilización de líneas', 40, null),
  ],
  unknownCount: 1,
  totalWeight: 100,
};

describe('PulseGapTable', () => {
  const markup = renderToStaticMarkup(
    <PulseGapTable board={buildPulseGapBoard(MOSAIC)} companyId="COMP_0001" />,
  );

  it('numbers the steps and links each plan', () => {
    expect(markup).toContain('1. Mínimo intramensual de caja');
    expect(markup).toContain('2. Días de cobro');
    expect(markup).toContain('3. Cartera vencida');
    expect(markup).toContain('href="/company/COMP_0001/action/cash_min"');
    expect(markup).toContain('href="/company/COMP_0001/action/ar90"');
    expect(markup.match(/Ver el plan/g)).toHaveLength(3);
  });

  it('shows the score, the points and the bar of every step', () => {
    expect(markup).toContain('Liquidez');
    expect(markup).toContain('+40,00');
    expect(markup).toContain('+13,33');
    expect(markup).toContain('width:100%');
    expect(markup).toContain('var(--score-critical)');
  });

  it('warns about the weight without data', () => {
    expect(markup).toContain('Utilización de líneas');
    expect(markup).toContain('40 puntos de peso');
  });
});

describe('PulseHeadlineTotal', () => {
  it('renders the figure with what it counts', () => {
    const markup = renderToStaticMarkup(
      <PulseHeadlineTotal value="24,15" caption="puntos de PULSE en juego" />,
    );
    expect(markup).toContain('24,15');
    expect(markup).toContain('puntos de PULSE en juego');
  });
});

describe('PulsePlanPanel', () => {
  const markup = renderToStaticMarkup(
    <PulsePlanPanel
      why="Mínimo intramensual de caja está en 20 sobre 100."
      steps={PLANS.cash_min.steps}
      actionHref="/company/COMP_0001/action"
      advisorHref="/company/COMP_0001/recommendations"
    />,
  );

  it('numbers the three steps of the plan', () => {
    expect(markup).toContain('1.');
    expect(markup).toContain('3.');
    expect(markup).toContain(PLANS.cash_min.steps[2]);
  });

  it('leads back to the list and on to the financing', () => {
    expect(markup).toContain('href="/company/COMP_0001/action"');
    expect(markup).toContain('href="/company/COMP_0001/recommendations"');
    expect(markup).toContain('Si necesitas financiación');
  });
});
