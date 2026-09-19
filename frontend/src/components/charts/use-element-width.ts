'use client';

import { useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * Measures the rendered width of an element and follows it as it resizes.
 *
 * Charts use the measured pixels as their viewBox width, so they fill the
 * container edge to edge and their text keeps a true pixel size instead of
 * scaling with the drawing.
 *
 * @param fallback - Width used on the server and before the first measure.
 * @returns The ref to attach and the current width in CSS pixels.
 */
export function useElementWidth<T extends HTMLElement>(
  fallback: number,
): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const next = Math.round(element.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
