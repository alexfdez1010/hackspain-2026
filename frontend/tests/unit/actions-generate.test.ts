import { describe, expect, it } from 'vitest';

import { sanitiseActions } from '@/lib/actions/generate';
import { MAX_DETAIL_LENGTH, MAX_TITLE_LENGTH } from '@/lib/actions/types';

/** Keys of the score, as the service reads them from the metadata. */
const KEYS = ['cash_days', 'dso'];

describe('sanitiseActions', () => {
  it('gives nothing back when the model gave nothing', () => {
    expect(sanitiseActions(undefined, KEYS)).toEqual([]);
    expect(sanitiseActions({ actions: [] }, KEYS)).toEqual([]);
  });

  it('keeps at most three actions, in the order the model wrote them', () => {
    const output = {
      actions: Array.from({ length: 5 }, (_, index) => ({
        title: `Acción ${index + 1}`,
        detail: 'Una frase con su cifra.',
        target: 'advisor',
      })),
    };
    const actions = sanitiseActions(output, KEYS);
    expect(actions).toHaveLength(3);
    expect(actions.map((action) => action.title)).toEqual([
      'Acción 1',
      'Acción 2',
      'Acción 3',
    ]);
  });

  it('drops an action the model left without a title', () => {
    const actions = sanitiseActions(
      {
        actions: [
          { title: '   ', detail: 'Sin nada que hacer.', target: 'advisor' },
          { title: 'Cobra la factura', detail: 'Son 45.000 €.', target: 'dso' },
        ],
      },
      KEYS,
    );
    expect(actions).toHaveLength(1);
    expect(actions[0].title).toBe('Cobra la factura');
  });

  it('cuts a long title at a word and marks the cut', () => {
    const title = `${'palabra '.repeat(20)}final`;
    const [action] = sanitiseActions(
      { actions: [{ title, detail: 'Corta.', target: 'advisor' }] },
      KEYS,
    );
    expect(action.title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
    expect(action.title.endsWith('…')).toBe(true);
    expect(action.title).not.toContain('palabr…');
  });

  it('cuts a long detail the same way and collapses its whitespace', () => {
    const detail = `Primero\n\n  segundo ${'muy larga '.repeat(30)}`;
    const [action] = sanitiseActions(
      { actions: [{ title: 'Contrata', detail, target: 'advisor' }] },
      KEYS,
    );
    expect(action.detail.length).toBeLessThanOrEqual(MAX_DETAIL_LENGTH);
    expect(action.detail.startsWith('Primero segundo muy larga')).toBe(true);
  });

  it('routes a target the app does not know to the recommendations', () => {
    const actions = sanitiseActions(
      {
        actions: [
          { title: 'Uno', detail: 'a', target: 'variable:cash_days' },
          { title: 'Dos', detail: 'b', target: 'variable:ebitda' },
          { title: 'Tres', detail: 'c', target: 'https://example.com' },
        ],
      },
      KEYS,
    );
    expect(actions.map((action) => action.target)).toEqual([
      'variable:cash_days',
      'advisor',
      'advisor',
    ]);
  });
});
