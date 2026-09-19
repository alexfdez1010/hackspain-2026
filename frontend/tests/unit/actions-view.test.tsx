import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  actionsNote,
  CompanyActionsPending,
  CompanyActionsView,
} from '@/components/actions/company-actions-view';
import type { CompanyAction, CompanyActions } from '@/lib/actions/types';
import type { CompanySection } from '@/lib/routes';

/** Three actions of one close, most important first. */
const ACTIONS: CompanyAction[] = [
  {
    title: 'Contrata la línea de crédito de 45.000 € a 12 meses',
    detail: 'Cubre 0,60 meses de pagos y el tipo queda en 9,17 % anual.',
    target: 'advisor',
  },
  {
    title: 'Explica la caída del PULSE antes de negociar',
    detail: 'El score bajó 6,2 puntos y la bajada dura tres meses.',
    target: 'signals',
  },
  {
    title: 'Sube días de caja a 30 días',
    detail: 'La prima bajaría 395 pb y la tensión pasaría del 28 % al 7 %.',
    target: 'variable:cash_days',
  },
];

/**
 * Renders the block with the actions handed to it, so no model is involved.
 *
 * @param result - Actions of the company, or `null` when it is unknown.
 * @param current - Section the reader is on.
 * @returns The static markup of the block.
 */
function render(
  result: CompanyActions | null,
  current: CompanySection = 'advisor',
): string {
  return renderToStaticMarkup(
    <CompanyActionsView
      result={result}
      companyId="COMP_0001"
      current={current}
    />,
  );
}

/**
 * Wraps a list of actions as one close of one company.
 *
 * @param actions - Actions to show.
 * @param mode - Where they came from.
 * @returns The value the loader gives the block.
 */
function close(
  actions: CompanyAction[],
  mode: 'mock' | 'gateway' = 'gateway',
): CompanyActions {
  return { companyId: 'COMP_0001', month: '2026-08', mode, actions };
}

describe('actionsNote', () => {
  it('says which close the actions read, and nothing else', () => {
    expect(actionsNote(close(ACTIONS))).toBe('Sobre el cierre de ago 2026');
    expect(actionsNote(close(ACTIONS, 'mock'))).toBe(
      'Sobre el cierre de ago 2026',
    );
    expect(actionsNote(null)).toBe('Sin datos de la empresa');
  });
});

describe('the actions block', () => {
  it('makes the first action the headline and the other two a row', () => {
    const markup = render(close(ACTIONS));
    expect(markup).toContain('Qué hacer ahora');
    expect(markup).toContain('Sobre el cierre de ago 2026');
    expect(markup).toContain('<h2');
    expect(markup).toContain('Contrata la línea de crédito de 45.000 €');
    expect(markup).toContain('Cubre 0,60 meses de pagos');
    const second = markup.indexOf('Explica la caída del PULSE');
    const third = markup.indexOf('Sube días de caja');
    expect(second).toBeGreaterThan(markup.indexOf('<h2'));
    expect(third).toBeGreaterThan(second);
    expect(markup).not.toContain('NaN');
  });

  it('links every action that is executed somewhere else', () => {
    const markup = render(close(ACTIONS));
    expect(markup).toContain('href="/company/COMP_0001/signals"');
    expect(markup).toContain('Ver la señal');
    expect(markup).toContain('href="/company/COMP_0001/variable/cash_days"');
    expect(markup).toContain('Ver la variable');
  });

  it('never links the page the reader is already on', () => {
    expect(render(close(ACTIONS), 'advisor')).not.toContain('Ver el producto');
    expect(render(close(ACTIONS), 'pulse')).toContain('Ver el producto');
  });

  it('flags a demo answer the way Nexo does', () => {
    expect(render(close(ACTIONS, 'mock'))).toContain('DEMO');
    expect(render(close(ACTIONS, 'gateway'))).not.toContain('DEMO');
  });

  it('shows no lower row when there is only one thing to do', () => {
    const markup = render(close([ACTIONS[0]]));
    expect(markup).toContain('Contrata la línea de crédito');
    expect(markup).not.toContain('Explica la caída');
    expect(markup).not.toContain('border-t');
  });

  it('says so in one sentence when nothing is urgent', () => {
    const markup = render(close([]));
    expect(markup).toContain('Nada urgente este mes');
    expect(markup).not.toContain('<h2');
  });

  it('holds the block open while the actions are written', () => {
    const markup = renderToStaticMarkup(<CompanyActionsPending />);
    expect(markup).toContain('Qué hacer ahora');
    expect(markup).toContain('Leyendo las cifras de la empresa…');
    expect(markup).toContain('aria-live="polite"');
  });
});
