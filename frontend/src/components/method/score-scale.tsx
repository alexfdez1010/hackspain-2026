import { buildBandSpans } from '@/lib/method/bands';
import { formatNumber } from '@/lib/format';

/** Where the worked month sits on the scale. */
export interface MethodScaleMarker {
  value: number;
  /** Who and when, such as `Atresmedia Labs, ago 2026`. */
  label: string;
}

interface MethodScoreScaleProps {
  /** What the scale is measured on and when; printed under the bar. */
  caption: string;
  /** Optional score drawn on the bar. */
  marker?: MethodScaleMarker | null;
}

/**
 * Draws the 0-100 scale of PULSE with its four bands, what each one means in
 * plain words and, when there is one, the worked month on the bar.
 *
 * The colours are the ones every other figure of the product uses for the same
 * score, and each band carries its name and its range in text, so the reading
 * never depends on the colour alone.
 *
 * @param props - The base of the figure and the optional marker.
 * @returns The band bar, the marker, the legend and the caption.
 */
export function MethodScoreScale({
  caption,
  marker = null,
}: MethodScoreScaleProps) {
  const spans = buildBandSpans();
  const description = spans
    .map((span) => `${span.name} ${span.range}`)
    .join(', ');
  const position = marker ? Math.min(Math.max(marker.value, 0), 100) : null;
  return (
    <figure className="flex max-w-[720px] flex-col gap-3">
      {marker && position !== null && (
        <div className="relative h-6 text-[13px] leading-[1.2]">
          <div
            className="absolute flex -translate-x-1/2 flex-col items-center gap-0.5"
            style={{ left: `${position}%` }}
          >
            <span className="whitespace-nowrap font-medium">
              {marker.label}: {formatNumber(marker.value, 1)}
            </span>
            <i
              aria-hidden
              className="block size-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink"
            />
          </div>
        </div>
      )}
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-sm"
        role="img"
        aria-label={`Escala de PULSE de 0 a 100 con cuatro bandas: ${description}`}
      >
        {spans.map((span) => (
          <div
            key={span.key}
            className="h-full"
            style={{ width: `${span.width}%`, backgroundColor: span.color }}
          />
        ))}
      </div>
      <div className="flex w-full">
        {spans.map((span) => (
          <div
            key={span.key}
            className="flex min-w-0 flex-col pr-2 text-[13px] leading-[1.45]"
            style={{ width: `${span.width}%` }}
          >
            <span className="font-medium">{span.name}</span>
            <span className="tabular-nums text-ink-secondary">
              {span.range}
            </span>
          </div>
        ))}
      </div>
      <ul className="mt-2 flex flex-col gap-2 text-[15px] leading-[1.55]">
        {spans.map((span) => (
          <li key={span.key} className="flex items-baseline gap-3">
            <i
              aria-hidden
              className="mt-1.5 size-2.5 shrink-0 rounded-full"
              style={{ background: span.color }}
            />
            <span>
              <span className="font-medium">{span.name}</span>
              <span className="text-ink-secondary"> · {span.meaning}</span>
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="text-[13px] leading-[1.45] text-ink-secondary">
        {caption}
      </figcaption>
    </figure>
  );
}
