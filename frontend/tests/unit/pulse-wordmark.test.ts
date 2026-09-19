import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  PULSE_MARK_WHITE,
  pulseMarkFill,
} from '@/components/layout/pulse-mark';

describe('pulse wordmark asset', () => {
  const file = path.join(process.cwd(), 'public', 'pulse-wordmark.svg');
  const svg = readFileSync(file, 'utf8');

  it('is a single-fill geometric mark that follows text color', () => {
    expect(svg).toMatch(/viewBox="[\d.]+ [\d.]+ [\d.]+ [\d.]+"/);
    expect(svg).toContain('fill="currentColor"');
    expect(svg).not.toMatch(/fill="#/);
    expect(svg.toLowerCase()).not.toContain('solo');
    expect(svg).not.toContain('u-right');
    expect(svg).toContain('id="letter-u"');
    expect(svg).toContain('28 22.72');
  });
});

describe('pulse wordmark white asset', () => {
  const file = path.join(process.cwd(), 'public', 'pulse-wordmark-white.svg');
  const svg = readFileSync(file, 'utf8');
  const ink = readFileSync(
    path.join(process.cwd(), 'public', 'pulse-wordmark.svg'),
    'utf8',
  );

  it('is the same geometry locked to white', () => {
    expect(svg).toContain(`fill="${PULSE_MARK_WHITE}"`);
    expect(svg).not.toContain('currentColor');
    expect(svg).toContain('id="letter-u"');
    expect(svg).toContain('28 22.72');
    expect(svg).toContain(ink.match(/id="letter-u" d="([^"]+)"/)?.[1]);
  });
});

describe('pulseMarkFill', () => {
  it('locks to white for the reverse tone', () => {
    expect(pulseMarkFill('white')).toBe(PULSE_MARK_WHITE);
    expect(pulseMarkFill('current')).toBe('currentColor');
  });
});
