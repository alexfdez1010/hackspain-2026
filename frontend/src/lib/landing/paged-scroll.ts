/** Duration of one band transition. Slow enough to read, not sluggish. */
export const PAGED_SCROLL_MS = 900;

/** Ignore leftover trackpad inertia after a transition settles. */
export const PAGED_SCROLL_COOLDOWN_MS = 180;

/** Accumulated wheel delta that counts as intent to change band. */
export const WHEEL_INTENT_PX = 48;

/** Finger travel that counts as a swipe to the next band. */
export const SWIPE_INTENT_PX = 56;

/**
 * Smooth start and settle for a full-viewport page change.
 *
 * @param t - Progress in `[0, 1]`.
 * @returns Eased progress in `[0, 1]`.
 */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/**
 * Keeps a band index inside the available range.
 *
 * @param index - Requested band.
 * @param count - Number of bands. Empty lists resolve to 0.
 * @returns A valid index.
 */
export function clampBandIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(index)));
}

/**
 * Offset of a band’s start inside the scroller.
 *
 * @param index - Band index.
 * @param bandSize - Viewport height of one band.
 * @returns `scrollTop` for that band.
 */
export function bandOffset(index: number, bandSize: number): number {
  return Math.max(0, index) * bandSize;
}

/**
 * Nearest band for a raw scroll offset.
 *
 * @param offset - Current `scrollTop`.
 * @param bandSize - Viewport height of one band.
 * @param count - Number of bands.
 * @returns Index of the nearest band.
 */
export function bandIndexFromOffset(
  offset: number,
  bandSize: number,
  count: number,
): number {
  if (bandSize <= 0) return 0;
  return clampBandIndex(offset / bandSize, count);
}

/**
 * Adjacent band in a paging direction.
 *
 * @param current - Index on screen.
 * @param direction - `1` down, `-1` up.
 * @param count - Number of bands.
 * @returns Clamped neighbour.
 */
export function neighborBandIndex(
  current: number,
  direction: 1 | -1,
  count: number,
): number {
  return clampBandIndex(current + direction, count);
}

/** Palette forced by a landing band. Product routes ignore this. */
export type LandingBandTheme = 'dark' | 'light';

/**
 * Theme for a marketing band. Hero and footer stay dark; the middle band is
 * light. Missing or unknown indices resolve to dark (first-paint default).
 *
 * @param index - Zero-based band.
 * @returns `light` only for the middle band.
 */
export function landingBandTheme(index: number): LandingBandTheme {
  return index === 1 ? 'light' : 'dark';
}

/**
 * Interprets accumulated wheel travel as a page intent.
 *
 * @param deltaY - Signed wheel delta, positive is down.
 * @param threshold - Minimum |delta| to count.
 * @returns Direction, or `0` if the gesture is still noise.
 */
export function wheelDirection(deltaY: number, threshold: number): 1 | -1 | 0 {
  if (deltaY >= threshold) return 1;
  if (deltaY <= -threshold) return -1;
  return 0;
}

export interface AnimateOffsetOptions {
  from: number;
  to: number;
  duration: number;
  apply: (value: number) => void;
  schedule: (cb: (time: number) => void) => number;
  cancelSchedule?: (id: number) => void;
  onComplete?: () => void;
}

/**
 * Tweens a numeric offset with ease-in-out cubic.
 *
 * Instant when `duration` is 0 or the span is empty. `cancel()` stops frames
 * and skips `onComplete`.
 *
 * @param options - Endpoints, timing, and host scheduler.
 * @returns Handle to abort the tween.
 */
export function animateOffset(options: AnimateOffsetOptions): {
  cancel: () => void;
} {
  const { from, to, duration, apply, schedule, cancelSchedule, onComplete } =
    options;

  if (duration <= 0 || from === to) {
    apply(to);
    onComplete?.();
    return { cancel: () => undefined };
  }

  let cancelled = false;
  let frame = 0;
  let start: number | null = null;

  const tick = (time: number) => {
    if (cancelled) return;
    if (start === null) start = time;
    const progress = Math.min(1, (time - start) / duration);
    apply(from + (to - from) * easeInOutCubic(progress));
    if (progress < 1) {
      frame = schedule(tick);
      return;
    }
    onComplete?.();
  };

  frame = schedule(tick);
  return {
    cancel: () => {
      cancelled = true;
      cancelSchedule?.(frame);
    },
  };
}
