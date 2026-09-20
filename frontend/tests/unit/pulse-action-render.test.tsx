import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PulseGapTable } from '@/components/pulse/gap-table';
import { PulseHeadlineTotal } from '@/components/pulse/headline-total';
import { PulsePlanPanel } from '@/components/pulse/plan-panel';
import { buildPulseGapBoard } from '@/lib/pulse/gap';
import type { PulseMosaic, PulseMosaicCell } from '@/lib/pulse/mosaic';
import { buildPulsePlanView } from '@/lib/pulse/plan-view';
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
    expect(markup.match(/aria-label="Qué mide /g)).toHaveLength(3);
  });

  it('heads the columns with the real weight of the month', () => {
    expect(markup).toContain('Variable');
    expect(markup).toContain('Valor');
    expect(markup).toContain('Mejora puntos');
    expect(markup).toContain('>Próximo paso<');
    expect(markup).toContain('aria-label="Qué significa Variable"');
    expect(markup).toContain('aria-label="Qué significa Valor"');
    expect(markup).not.toContain('>Score<');
    expect(markup).not.toContain('>Puntos<');
  });

  it('prints the real figure and keeps the score as its note', () => {
    expect(markup.match(/5,0 días/g)).toHaveLength(3);
    expect(markup).toContain(
      'aria-label="Qué significa el valor de Mínimo intramensual de caja"',
    );
    expect(markup).toContain('aria-label="Qué significa Mejora puntos"');
    expect(markup).not.toContain('title="Score');
  });

  it('shows the points and the bar of every step', () => {
    expect(markup).toContain('Liquidez');
    expect(markup).toContain('+40,00');
    expect(markup).toContain('+13,33');
    expect(markup).toContain('width:100%');
    expect(markup).toContain('var(--score-critical)');
  });

  it('washes every step with its band instead of boxing it', () => {
    expect(markup).toContain(
      'color-mix(in oklab, var(--score-critical) 10%, var(--surface-raised))',
    );
    expect(markup).toContain(
      'color-mix(in oklab, var(--score-critical) 20%, var(--surface-raised))',
    );
    const cards = markup.slice(markup.indexOf('<ul'), markup.indexOf('</ul>'));
    expect(cards).not.toContain('border');
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
  const view = buildPulsePlanView(MOSAIC.cells[0], 60);
  const markup = renderToStaticMarkup(
    <PulsePlanPanel
      figures={view.figures}
      why={view.why}
      steps={PLANS.cash_min.steps}
      actionHref="/company/COMP_0001/action"
      advisorHref="/company/COMP_0001/recommendations"
    />,
  );

  it('heads the plan with the five figures of the month', () => {
    expect(markup).toContain('Valor real de hoy');
    expect(markup).toContain('5,0 días');
    expect(markup).toContain('Score de hoy, sobre 100');
    expect(markup).toContain('Si la variable llega a 100');
    expect(markup).toContain('+40,00 pts');
    expect(markup).toContain('Coste de la medida');
    expect(markup).toContain('Cuándo se ve en el PULSE');
  });

  it('numbers the three steps of the plan under «Qué hacer»', () => {
    expect(markup).toContain('Qué hacer');
    expect(markup).toContain('1.');
    expect(markup).toContain('3.');
    expect(markup).toContain(PLANS.cash_min.steps[2]);
  });

  it('separates the steps and the footer with space, not with lines', () => {
    const steps = markup.slice(markup.indexOf('<ol'), markup.indexOf('</ol>'));
    expect(steps).not.toContain('border');
    expect(markup.slice(markup.indexOf('</ol>'))).not.toContain('border');
  });

  it('leads back to the list and on to the financing', () => {
    expect(markup).toContain('href="/company/COMP_0001/action"');
    expect(markup).toContain('href="/company/COMP_0001/recommendations"');
    expect(markup).toContain('Si necesitas financiación');
  });
});
