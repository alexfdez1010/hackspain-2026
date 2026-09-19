import { describe, expect, it } from 'vitest';

import {
  formatBand,
  formatConfidence,
  formatConfidencePoints,
  formatHorizon,
  formatRawValue,
  UNKNOWN_TEXT,
} from '@/lib/pulse/format';

/**
 * Replaces the non-breaking spaces `Intl` inserts, so assertions stay readable.
 *
 * @param value - Formatted string.
 * @returns The same string with plain spaces.
 */
function plain(value: string): string {
  return value.replace(/ /g, ' ');
}

describe('formatRawValue', () => {
  it('renders share units as percentages keeping their base', () => {
    expect(plain(formatRawValue(0.1, '% de la cartera'))).toBe(
      '10,0 % de la cartera',
    );
    expect(plain(formatRawValue(-0.37, '% vs trimestre anterior'))).toBe(
      '-37,0 % vs trimestre anterior',
    );
  });

  it('renders days with one decimal and other units with two', () => {
    expect(formatRawValue(14.03, 'días')).toBe('14,0 días');
    expect(plain(formatRawValue(0.11, 'x salidas mensuales'))).toBe(
      '0,11 x salidas mensuales',
    );
  });

  it('never renders a missing figure as a zero', () => {
    expect(formatRawValue(null, 'días')).toBe(UNKNOWN_TEXT);
    expect(formatRawValue(Number.NaN, 'días')).toBe(UNKNOWN_TEXT);
    expect(formatRawValue(0, 'días')).toBe('0,0 días');
  });
});

describe('confidence', () => {
  it('reads as a percentage and as points of the score', () => {
    expect(plain(formatConfidence(0.82))).toBe('82 %');
    expect(formatConfidencePoints(0.82)).toBe('82 de 100 puntos con datos');
  });

  it('degrades when the export carries no confidence', () => {
    expect(formatConfidence(null)).toBe('—');
    expect(formatConfidencePoints(null)).toBe('Sin cobertura conocida');
  });
});

describe('forecast labels', () => {
  it('names the horizon in months', () => {
    expect(formatHorizon(6)).toBe('+6 m');
  });

  it('renders the band and falls back when a bound is missing', () => {
    expect(formatBand(15.58, 48.35)).toBe('15,6-48,4');
    expect(formatBand(null, 48.35)).toBe('—');
  });
});
