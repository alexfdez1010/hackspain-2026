'use client';

import { useEffect, type RefObject } from 'react';

import {
  animateOffset,
  bandIndexFromOffset,
  bandOffset,
  clampBandIndex,
  landingBandTheme,
  neighborBandIndex,
  PAGED_SCROLL_COOLDOWN_MS,
  PAGED_SCROLL_MS,
  SWIPE_INTENT_PX,
  WHEEL_INTENT_PX,
  wheelDirection,
} from '@/lib/landing/paged-scroll';

/**
 * Pages a full-viewport scroller one band per gesture, with a cinematic tween.
 *
 * Native CSS snap is too abrupt; this owns wheel, swipe and keys. Reduced
 * motion jumps without tweening. Sets `data-band` and `data-band-theme` at
 * the start of each page so tokens and the footer Heatmap tween with the
 * scroll. No-op when the ref is empty.
 *
 * @param scrollerRef - Element that contains equal-height bands.
 */
export function usePagedScroll(scrollerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    root.dataset.paged = '';

    let current = bandIndexFromOffset(
      root.scrollTop,
      root.clientHeight,
      root.children.length,
    );
    const applyBand = (index: number) => {
      root.dataset.band = String(index);
      root.dataset.bandTheme = landingBandTheme(index);
    };

    applyBand(current);
    let locked = false;
    let acc = 0;
    let touchY = 0;
    let cooldown = 0;
    let tween = { cancel: () => undefined as void };

    const count = () => root.children.length;

    const unlockLater = () => {
      window.clearTimeout(cooldown);
      cooldown = window.setTimeout(() => {
        locked = false;
      }, PAGED_SCROLL_COOLDOWN_MS);
    };

    const go = (next: number) => {
      const clamped = clampBandIndex(next, count());
      const target = bandOffset(clamped, root.clientHeight);
      if (target === root.scrollTop && clamped === current) return;
      current = clamped;
      applyBand(current);
      locked = true;
      acc = 0;
      tween.cancel();
      tween = animateOffset({
        from: root.scrollTop,
        to: target,
        duration: reduced ? 0 : PAGED_SCROLL_MS,
        apply: (value) => {
          root.scrollTop = value;
        },
        schedule: (cb) => requestAnimationFrame(cb),
        cancelSchedule: (id) => cancelAnimationFrame(id),
        onComplete: unlockLater,
      });
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (locked) return;
      acc += event.deltaY;
      const direction = wheelDirection(acc, WHEEL_INTENT_PX);
      if (direction === 0) return;
      go(neighborBandIndex(current, direction, count()));
    };

    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (locked) return;
      const endY = event.changedTouches[0]?.clientY ?? touchY;
      const travel = touchY - endY;
      if (Math.abs(travel) < SWIPE_INTENT_PX) return;
      go(neighborBandIndex(current, travel > 0 ? 1 : -1, count()));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          'a, button, input, textarea, select, [role="button"]',
        )
      ) {
        return;
      }
      const map: Record<string, number | undefined> = {
        ArrowDown: current + 1,
        PageDown: current + 1,
        ' ': current + 1,
        ArrowUp: current - 1,
        PageUp: current - 1,
        Home: 0,
        End: count() - 1,
      };
      const next = map[event.key];
      if (next === undefined) return;
      event.preventDefault();
      if (locked) return;
      go(next);
    };

    const onResize = () => {
      root.scrollTop = bandOffset(current, root.clientHeight);
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);

    return () => {
      tween.cancel();
      window.clearTimeout(cooldown);
      delete root.dataset.paged;
      delete root.dataset.band;
      delete root.dataset.bandTheme;
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [scrollerRef]);
}
