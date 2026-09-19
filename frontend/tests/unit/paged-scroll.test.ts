import { describe, expect, it, vi } from 'vitest';

import {
  animateOffset,
  bandIndexFromOffset,
  bandOffset,
  clampBandIndex,
  easeInOutCubic,
  landingBandTheme,
  neighborBandIndex,
  wheelDirection,
} from '@/lib/landing/paged-scroll';

describe('easeInOutCubic', () => {
  it('starts still, crosses the midpoint, and settles', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });
});

describe('band indexing', () => {
  it('clamps empty and overflowing indices', () => {
    expect(clampBandIndex(2, 0)).toBe(0);
    expect(clampBandIndex(-1, 3)).toBe(0);
    expect(clampBandIndex(9, 3)).toBe(2);
  });

  it('maps offsets to the nearest band', () => {
    expect(bandOffset(2, 900)).toBe(1800);
    expect(bandIndexFromOffset(0, 900, 3)).toBe(0);
    expect(bandIndexFromOffset(500, 900, 3)).toBe(1);
    expect(bandIndexFromOffset(1800, 0, 3)).toBe(0);
    expect(neighborBandIndex(0, -1, 3)).toBe(0);
    expect(neighborBandIndex(1, 1, 3)).toBe(2);
  });
});

describe('landingBandTheme', () => {
  it('is dark on the hero and footer, light in the middle', () => {
    expect(landingBandTheme(0)).toBe('dark');
    expect(landingBandTheme(1)).toBe('light');
    expect(landingBandTheme(2)).toBe('dark');
    expect(landingBandTheme(-1)).toBe('dark');
  });
});

describe('wheelDirection', () => {
  it('ignores noise until the threshold', () => {
    expect(wheelDirection(20, 48)).toBe(0);
    expect(wheelDirection(48, 48)).toBe(1);
    expect(wheelDirection(-48, 48)).toBe(-1);
  });
});

describe('animateOffset', () => {
  it('jumps when duration is zero', () => {
    const apply = vi.fn();
    const onComplete = vi.fn();
    animateOffset({
      from: 0,
      to: 900,
      duration: 0,
      apply,
      schedule: () => 1,
      onComplete,
    });
    expect(apply).toHaveBeenCalledWith(900);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('eases through the midpoint and completes', () => {
    let next: ((time: number) => void) | undefined;
    const applied: number[] = [];
    const onComplete = vi.fn();
    animateOffset({
      from: 0,
      to: 900,
      duration: 100,
      apply: (value) => applied.push(value),
      schedule: (cb) => {
        next = cb;
        return 1;
      },
      onComplete,
    });
    next?.(0);
    expect(applied.at(-1)).toBe(0);
    next?.(50);
    expect(applied.at(-1)).toBe(450);
    next?.(100);
    expect(applied.at(-1)).toBe(900);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('skips onComplete after cancel', () => {
    let next: ((time: number) => void) | undefined;
    const onComplete = vi.fn();
    const tween = animateOffset({
      from: 0,
      to: 900,
      duration: 100,
      apply: () => undefined,
      schedule: (cb) => {
        next = cb;
        return 7;
      },
      cancelSchedule: vi.fn(),
      onComplete,
    });
    tween.cancel();
    next?.(100);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
