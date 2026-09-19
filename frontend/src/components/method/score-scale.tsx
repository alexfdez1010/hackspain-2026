import { buildBandSpans } from '@/lib/method/bands';

interface MethodScoreScaleProps {
  /** What the scale is measured on and when; printed under the bar. */
  caption: string;
}

/**
 * Draws the 0-100 scale of PULSE with its four bands and the cuts between them.
 *
 * The colours are the ones every other figure of the product uses for the same
 * score, and each band carries its name and its range in text, so the reading
 * never depends on the colour alone.
 *
 * @param props - The base of the figure.
 * @returns The band bar with its labels.
 */
export function MethodScoreScale({ caption }: MethodScoreScaleProps) {
  const spans = buildBandSpans();
  const description = spans
    .map((span) => `${span.name} ${span.range}`)
    .join(', ');
  return (
    <figure className="flex max-w-3xl flex-col gap-2">
      <div
        className="flex h-3 w-full overflow-hidden rounded-sm"
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
      <div className="flex w-full text-xs">
        {spans.map((span) => (
          <div
            key={span.key}
            className="flex min-w-0 flex-col pr-2"
            style={{ width: `${span.width}%` }}
          >
            <span className="font-medium">{span.name}</span>
            <span className="tabular-nums text-muted">{span.range}</span>
          </div>
        ))}
      </div>
      <figcaption className="text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}
