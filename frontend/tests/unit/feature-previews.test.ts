import { describe, expect, it } from 'vitest';

import {
  DIAGNOSIS_PREVIEW,
  FINANCING_PREVIEW,
  SIGNAL_PREVIEW,
} from '@/lib/landing/feature-previews';
import { scoreBand } from '@/lib/score';

describe('feature preview snapshots', () => {
  it('tints diagnosis variables into three different bands', () => {
    expect(DIAGNOSIS_PREVIEW.notice).toContain('cobros');
    expect(DIAGNOSIS_PREVIEW.variables).toHaveLength(3);
    const bands = DIAGNOSIS_PREVIEW.variables.map(
      (variable) => scoreBand(variable.score).key,
    );
    expect(bands).toEqual(['critical', 'critical', 'fragile']);
  });

  it('opens the alert as a bache still running', () => {
    expect(SIGNAL_PREVIEW.kind).toBe('bache');
    expect(SIGNAL_PREVIEW.month).toBe(SIGNAL_PREVIEW.lastMonth);
    expect(SIGNAL_PREVIEW.status).toContain('71');
    expect(SIGNAL_PREVIEW.headline).not.toBe(SIGNAL_PREVIEW.detail);
  });

  it('moves liquidity up the scale with an approved line', () => {
    expect(FINANCING_PREVIEW.amount).toBeGreaterThan(0);
    expect(FINANCING_PREVIEW.target).toBeGreaterThan(FINANCING_PREVIEW.current);
    expect(scoreBand(FINANCING_PREVIEW.current).key).toBe('critical');
    expect(scoreBand(FINANCING_PREVIEW.target).key).toBe('neutral');
  });
});
