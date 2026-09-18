import { describe, expect, it } from 'vitest';

import {
  formatBps,
  formatEuro,
  formatMonth,
  formatMonthShort,
  formatNumber,
  formatPercent,
  formatSigned,
} from '@/lib/xray/format';

describe('formatNumber', () => {
  it('uses Spanish separators', () => {
    expect(formatNumber(1286)).toBe('1286');
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(59.1574, 1)).toBe('59,2');
  });

  it('renders an em dash without a value', () => {
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(Number.NaN)).toBe('—');
  });
});

describe('formatEuro', () => {
  it('uses compact notation for large amounts', () => {
    expect(formatEuro(2_000_000)).toContain('M');
    expect(formatEuro(500)).toContain('500');
  });

  it('renders an em dash without a value', () => {
    expect(formatEuro(null)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('renders a ratio as a percentage', () => {
    expect(formatPercent(0.7738, 1).replace(/\s/g, ' ')).toBe('77,4 %');
    expect(formatPercent(null)).toBe('—');
  });
});

describe('formatSigned', () => {
  it('always shows the sign', () => {
    expect(formatSigned(2.55)).toBe('+2,6');
    expect(formatSigned(-2.55)).toBe('−2,6');
    expect(formatSigned(0)).toBe('0,0');
    expect(formatSigned(null)).toBe('—');
  });
});

describe('month formatting', () => {
  it('renders a Spanish month label', () => {
    expect(formatMonth('2026-08')).toBe('ago 2026');
    expect(formatMonthShort('2026-01')).toBe('ene');
  });

  it('returns malformed input untouched', () => {
    expect(formatMonth('agosto')).toBe('agosto');
    expect(formatMonth('2026-13')).toBe('2026-13');
  });
});

describe('formatBps', () => {
  it('labels basis points', () => {
    expect(formatBps(370)).toBe('370 pb');
  });
});
