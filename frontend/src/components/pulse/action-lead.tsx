import Link from 'next/link';

import { buildPulseGapBoard } from '@/lib/pulse/gap';
import { buildPulseMosaic } from '@/lib/pulse/mosaic';
import type {
  PulsePillarMeta,
  PulseSeriesPoint,
  PulseVariableMeta,
} from '@/lib/pulse/types';
import { companyRoutes } from '@/lib/routes';
import { formatNumber } from '@/lib/format';

interface PulseActionLeadProps {
  /** Company the link belongs to, such as `COMP_0001`. */
  companyId: string;
  pillars: readonly PulsePillarMeta[];
  variables: readonly PulseVariableMeta[];
  /** Month the points are counted on; `null` hides the row. */
  point: PulseSeriesPoint | null;
}

/**
 * Turns the headline score into the one thing to do next: how many points of
 * PULSE the three largest gaps of the month still hold, and the way out to
 * «Acción», where those points are named one by one.
 *
 * It is the only sentence of the summary that asks for something, so it is
 * right-aligned above the KPI strip instead of competing with the score: the
 * figure reads as the reason for the link, not as a fifth qualifier. The row
 * computes the board itself and renders nothing when the month measured no
 * variable, because a link to an empty ranking is worse than no link.
 *
 * The link is an outlined control, not the brand blue button: the single
 * accent stays reserved for the actions block, and the hairline of
 * `--border-strong` is what the design system already uses to outline a
 * control. The 1.05 lift on hover is gated behind `motion-safe`.
 *
 * @param props - Company, score metadata and the month to count.
 * @returns The sentence and its link, or `null` when nothing is on the table.
 */
export function PulseActionLead({
  companyId,
  pillars,
  variables,
  point,
}: PulseActionLeadProps) {
  const board = buildPulseGapBoard(buildPulseMosaic(pillars, variables, point));
  if (board.steps.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-5">
      <p className="text-[17px] leading-[1.6] text-ink-secondary">
        Tienes {formatNumber(board.total, 2)} puntos de PULSE en juego
      </p>
      <Link
        href={companyRoutes(companyId).action}
        className="inline-flex shrink-0 items-center gap-2 rounded-[6px] border border-hairline-strong px-[14px] py-[9px] text-sm font-medium leading-none text-ink-secondary transition-[color,border-color,transform] duration-[160ms] hover:border-ink-secondary hover:text-ink motion-safe:hover:scale-105"
      >
        Pasar a la acción
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
