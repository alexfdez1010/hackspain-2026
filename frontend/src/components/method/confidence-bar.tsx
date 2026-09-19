import type {
  MethodConfidenceSegment,
  MethodCoverage,
} from '@/lib/method/example';
import { formatConfidencePoints } from '@/lib/pulse/format';
import { formatNumber } from '@/lib/format';

/** Fill of each coverage state; the proxy stripe reads as half a fill. */
const FILL: Record<MethodCoverage, string> = {
  known: 'var(--accent)',
  proxy:
    'repeating-linear-gradient(45deg, var(--accent) 0 5px, var(--surface-secondary) 5px 10px)',
  unknown: 'var(--surface-secondary)',
};

const LEGEND: readonly { coverage: MethodCoverage; text: string }[] = [
  { coverage: 'known', text: 'Con datos: cuenta con todo su peso' },
  {
    coverage: 'proxy',
    text: 'Solo proxy bancario: cuenta la mitad de su peso',
  },
  {
    coverage: 'unknown',
    text: 'Sin datos: no cuenta, y tampoco resta como un cero',
  },
];

interface MethodConfidenceBarProps {
  segments: readonly MethodConfidenceSegment[];
  /** Share of the 100 points backed by data in the month drawn. */
  confidence: number | null;
  /** Which company and month the bar shows. */
  caption: string;
}

/**
 * Draws the 100 points of one month split by the evidence behind them.
 *
 * This is what the confidence figure means: the score is the weighted mean of
 * the variables that had data, so a missing variable shrinks the base instead
 * of entering the average as a zero.
 *
 * @param props - The segments of the month, its confidence and the base.
 * @returns The coverage bar with its legend.
 */
export function MethodConfidenceBar({
  segments,
  confidence,
  caption,
}: MethodConfidenceBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.weight, 0);
  if (total <= 0) {
    return (
      <p className="text-[15px] leading-[1.55] text-ink-secondary">
        El export no publica la cobertura de este mes.
      </p>
    );
  }
  const covered = segments.filter((segment) => segment.coverage !== 'unknown');
  return (
    <figure className="flex max-w-[720px] flex-col gap-4">
      <div
        className="flex h-8 w-full gap-0.5"
        role="img"
        aria-label={`${formatNumber(covered.length)} de ${formatNumber(segments.length)} variables con datos, ${formatConfidencePoints(confidence)}`}
      >
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="h-full rounded-[2px]"
            style={{
              width: `${(segment.weight / total) * 100}%`,
              background: FILL[segment.coverage],
            }}
            title={`${segment.label} · ${formatNumber(segment.weight)} pts`}
          />
        ))}
      </div>
      <p className="text-xl font-semibold leading-[1.3] tabular-nums">
        {formatConfidencePoints(confidence)}
      </p>
      <ul className="flex flex-col gap-2 text-[13px] leading-[1.45] text-ink-secondary">
        {LEGEND.map((item) => (
          <li key={item.coverage} className="flex items-center gap-2">
            <span
              className="h-3 w-6 shrink-0 rounded-[2px]"
              style={{ background: FILL[item.coverage] }}
            />
            {item.text}
          </li>
        ))}
      </ul>
      <figcaption className="text-[13px] leading-[1.45] text-ink-secondary">
        {caption}
      </figcaption>
    </figure>
  );
}
