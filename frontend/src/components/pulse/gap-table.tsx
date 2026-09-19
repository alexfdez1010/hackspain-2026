import Link from 'next/link';

import type { PulseGapBoard, PulseGapStep } from '@/lib/pulse/gap';
import { companyActionRoute } from '@/lib/routes';
import { formatNumber } from '@/lib/format';

interface GapTableProps {
  board: PulseGapBoard;
  /** Company the plans belong to. */
  companyId: string;
}

/**
 * Four columns from `md`; under it the variable takes the whole first row and
 * score, points and plan share the second, so a long variable name never
 * squeezes the figures on a phone.
 */
const ROW_CLASS =
  'grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-3 md:grid-cols-[minmax(0,1fr)_72px_96px_196px] md:gap-6';
/** The variable cell spans the row under `md`. */
const NAME_CLASS = 'col-span-3 min-w-0 md:col-span-1';

/**
 * Renders one step: the variable, its score, the points it holds and its plan.
 *
 * The bar is the points of the step over the points of the largest one, so the
 * first row is always full and the rest are read against it; its colour is the
 * band of the score, never a decorative accent.
 *
 * @param props - The step and the company it belongs to.
 * @returns One row of the table.
 */
function GapRow({
  step,
  companyId,
}: {
  step: PulseGapStep;
  companyId: string;
}) {
  return (
    <li
      className={`${ROW_CLASS} border-b border-hairline py-6 last:border-b-0`}
    >
      <span className={NAME_CLASS}>
        <b className="block text-[20px] font-semibold leading-[1.35] tracking-[-0.01em]">
          {step.rank}. {step.label}
        </b>
        <span className="mt-0.5 inline-flex items-center gap-2 text-[15px] leading-[1.55] text-ink-secondary">
          <i
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: step.band.color }}
          />
          {step.pillarLabel}
        </span>
        <span className="mt-3 block h-2 max-w-[320px] rounded bg-surface-secondary">
          <span
            className="block h-full rounded"
            style={{
              width: `${Math.round(step.share * 100)}%`,
              background: step.band.color,
            }}
          />
        </span>
      </span>
      <span className="text-left text-[20px] font-semibold leading-[1.35] tabular-nums md:text-right">
        {formatNumber(step.score)}
      </span>
      <b className="whitespace-nowrap text-left text-[17px] md:text-right font-semibold leading-[1.1] tracking-[-0.01em] tabular-nums md:text-[20px]">
        +{formatNumber(step.points, 2)}
        <span className="text-[13px] font-normal text-ink-secondary"> pts</span>
      </b>
      <span className="text-right">
        <Link
          href={companyActionRoute(companyId, step.key)}
          className="text-[15px] font-medium leading-none whitespace-nowrap hover:text-link-accent md:text-[17px]"
        >
          Ver el plan →
        </Link>
      </span>
    </li>
  );
}

/**
 * The three variables holding the most points of PULSE, with the plan of each.
 *
 * The order is the gap — weight times the distance to 100, renormalised over
 * the weight with data — and not the score: the lowest score may weigh three
 * points and move nothing, while a mid score on the heaviest variable is where
 * the month is actually decided.
 *
 * @param props - The ranked steps and the company they belong to.
 * @returns The table of steps with the note about the variables without data.
 */
export function PulseGapTable({ board, companyId }: GapTableProps) {
  return (
    <div>
      <div
        className={`hidden items-end border-b border-hairline pb-2.5 text-sm font-medium leading-[1.2] text-ink-secondary md:grid md:grid-cols-[minmax(0,1fr)_72px_96px_196px] md:gap-6`}
      >
        <span>Variable</span>
        <span className="text-right">Score</span>
        <span className="text-right">Puntos</span>
        <span className="text-right">Próximo paso</span>
      </div>
      <ul>
        {board.steps.map((step) => (
          <GapRow key={step.key} step={step} companyId={companyId} />
        ))}
      </ul>
      {board.blindNote && (
        <p className="border-t border-hairline pt-4 text-[13px] leading-[1.45] text-ink-secondary">
          {board.blindNote}
        </p>
      )}
    </div>
  );
}
