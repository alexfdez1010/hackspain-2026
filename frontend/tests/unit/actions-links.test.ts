import { describe, expect, it } from 'vitest';

import { actionLink, normaliseTarget } from '@/lib/actions/links';

/** Keys of the score, as the service reads them from the metadata. */
const KEYS = ['cash_days', 'dso', 'debt_service'];

describe('normaliseTarget', () => {
  it('keeps the four fixed targets', () => {
    expect(normaliseTarget('advisor', KEYS)).toBe('advisor');
    expect(normaliseTarget('signals', KEYS)).toBe('signals');
    expect(normaliseTarget('pulse', KEYS)).toBe('pulse');
    expect(normaliseTarget(' method ', KEYS)).toBe('method');
  });

  it('keeps a variable target that belongs to the score', () => {
    expect(normaliseTarget('variable:cash_days', KEYS)).toBe(
      'variable:cash_days',
    );
  });

  it('sends an unknown target to the recommendations', () => {
    expect(normaliseTarget('https://example.com', KEYS)).toBe('advisor');
    expect(normaliseTarget('', KEYS)).toBe('advisor');
    expect(normaliseTarget('portfolio', KEYS)).toBe('advisor');
  });

  it('sends a variable outside the score to the recommendations', () => {
    expect(normaliseTarget('variable:ebitda', KEYS)).toBe('advisor');
    expect(normaliseTarget('variable:../../etc', KEYS)).toBe('advisor');
  });
});

describe('actionLink', () => {
  it('names where the link leads, never where the reader is', () => {
    expect(actionLink('signals', 'COMP_0001', 'advisor')).toEqual({
      href: '/company/COMP_0001/signals',
      label: 'Ver la señal',
    });
    expect(actionLink('variable:cash_days', 'COMP_0001', 'advisor')).toEqual({
      href: '/company/COMP_0001/variable/cash_days',
      label: 'Ver la variable',
    });
  });

  it('drops the link when the action executes on this very page', () => {
    expect(actionLink('advisor', 'COMP_0001', 'advisor')).toBeNull();
    expect(actionLink('signals', 'COMP_0001', 'signals')).toBeNull();
    expect(actionLink('advisor', 'COMP_0001', 'pulse')).not.toBeNull();
  });
});
