import { ArtEleven, ArtGauge, ArtReport } from '@/components/method/art';
import type { MethodIdeaPanel } from '@/lib/method/idea';

interface MethodIdeaStripProps {
  panels: readonly MethodIdeaPanel[];
  /** PULSE of the worked month, where the dial points. */
  pulse: number | null;
}

/**
 * Tells the whole method in three drawings: what is looked at, how each thing
 * is graded and how the grades become one number, each with the figures of
 * the worked month underneath.
 *
 * @param props - The three panels and the score the dial points at.
 * @returns The strip, one column on a phone and three on a desktop.
 */
export function MethodIdeaStrip({ panels, pulse }: MethodIdeaStripProps) {
  return (
    <ol className="grid gap-x-8 gap-y-8 md:grid-cols-3">
      {panels.map((panel, index) => (
        <li
          key={panel.key}
          className="flex flex-col gap-3 border-t border-hairline pt-5"
        >
          {panel.art === 'eleven' && <ArtEleven />}
          {panel.art === 'report' && <ArtReport />}
          {panel.art === 'gauge' && <ArtGauge value={pulse} />}
          <h3 className="text-[17px] font-semibold leading-[1.35]">
            <span className="mr-2 tabular-nums text-ink-muted">
              {index + 1}
            </span>
            {panel.title}
          </h3>
          <p className="text-[15px] leading-[1.55] text-ink-secondary">
            {panel.text}
          </p>
          {panel.example && (
            <p className="text-[15px] leading-[1.55]">
              <span className="font-medium">Por ejemplo: </span>
              {panel.example}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
