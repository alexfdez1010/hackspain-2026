import type { ReactNode } from 'react';

import { buildBandSpans } from '@/lib/method/bands';

interface ArtProps {
  children: ReactNode;
  /** Size utilities; the drawing is square. */
  className?: string;
}

/**
 * The frame every drawing of the method page shares: a 96-unit square drawn
 * in ink with round strokes, hidden from assistive technology because the
 * text next to it already says what it shows.
 *
 * @param props - The shapes and the size utilities.
 * @returns The SVG frame.
 */
export function Art({ children, className = 'size-16' }: ArtProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden
      className={`shrink-0 text-ink ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Fill of a shape that reads as a surface, not as a mark. */
export const ART_SURFACE = 'var(--surface-deep)';
/** Fill of the one thing each drawing points at. */
export const ART_ACCENT = 'var(--accent)';

/** Eleven dots in four boxes: the variables grouped by pillar. */
export function ArtEleven() {
  const boxes = [
    [8, 8, 2],
    [50, 8, 3],
    [8, 50, 2],
    [50, 50, 4],
  ] as const;
  return (
    <Art>
      {boxes.map(([x, y, dots]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={38} height={38} rx={8} fill={ART_SURFACE} />
          {Array.from({ length: dots }, (_, index) => (
            <circle
              key={index}
              cx={x + 11 + (index % 2) * 16}
              cy={y + (dots > 2 ? 11 : 19) + Math.floor(index / 2) * 16}
              r={4}
              fill={ART_ACCENT}
              stroke="none"
            />
          ))}
        </g>
      ))}
    </Art>
  );
}

/** A report card: three lines, each with its bar of 0 to 100. */
export function ArtReport() {
  const rows = [
    [26, 22],
    [44, 10],
    [62, 30],
  ] as const;
  return (
    <Art>
      <rect x={16} y={8} width={64} height={80} rx={6} fill={ART_SURFACE} />
      {rows.map(([y, width]) => (
        <g key={y}>
          <line x1={26} y1={y + 4} x2={40} y2={y + 4} />
          <rect x={46} y={y} width={26} height={8} rx={2} fill="white" />
          <rect
            x={46}
            y={y}
            width={width}
            height={8}
            rx={2}
            fill={ART_ACCENT}
            stroke="none"
          />
        </g>
      ))}
    </Art>
  );
}

interface ArtGaugeProps {
  /** Score the needle points at; `null` leaves the dial without a needle. */
  value: number | null;
}

/**
 * A dial of 0 to 100 painted in the four score bands, with the needle on the
 * worked month.
 *
 * @param props - Score the needle points at.
 * @returns The dial.
 */
export function ArtGauge({ value }: ArtGaugeProps) {
  const spans = buildBandSpans();
  let offset = 0;
  const angle =
    value === null
      ? null
      : Math.PI * (1 - Math.min(Math.max(value, 0), 100) / 100);
  return (
    <Art>
      {spans.map((span) => {
        const dash = `${span.width} 100`;
        const element = (
          <path
            key={span.key}
            d="M14 64 A34 34 0 0 1 82 64"
            pathLength={100}
            stroke={span.color}
            strokeWidth={9}
            strokeLinecap="butt"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
          />
        );
        offset += span.width;
        return element;
      })}
      {angle !== null && (
        <line
          x1={48}
          y1={64}
          x2={48 + 26 * Math.cos(angle)}
          y2={64 - 26 * Math.sin(angle)}
          strokeWidth={3}
        />
      )}
      <circle cx={48} cy={64} r={5} fill="currentColor" stroke="none" />
    </Art>
  );
}

/** A puzzle of nine pieces with one missing: the data a month lacks. */
export function ArtPuzzle() {
  const cells = Array.from({ length: 9 }, (_, index) => ({
    x: 10 + (index % 3) * 26,
    y: 10 + Math.floor(index / 3) * 26,
    missing: index === 5,
  }));
  return (
    <Art>
      {cells.map((cell) =>
        cell.missing ? (
          <rect
            key={`${cell.x}-${cell.y}`}
            x={cell.x}
            y={cell.y}
            width={24}
            height={24}
            rx={4}
            strokeDasharray="4 4"
          />
        ) : (
          <rect
            key={`${cell.x}-${cell.y}`}
            x={cell.x}
            y={cell.y}
            width={24}
            height={24}
            rx={4}
            fill={ART_ACCENT}
            fillOpacity={0.25}
          />
        ),
      )}
    </Art>
  );
}
