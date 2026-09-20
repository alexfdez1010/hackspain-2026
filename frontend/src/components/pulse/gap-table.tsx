import Link from 'next/link';

import { VariableInfoMark } from '@/components/charts/variable-info-mark';
import { InfoTip } from '@/components/ui/info-tip';
import type { PulseGapBoard, PulseGapStep } from '@/lib/pulse/gap';
import { bandTint } from '@/lib/pulse/band';
import { formatRawValue } from '@/lib/pulse/format';
import { companyActionRoute } from '@/lib/routes';
import { formatNumber } from '@/lib/format';

interface GapTableProps {
  board: PulseGapBoard;
  /** Company the plans belong to. */
  companyId: string;
}

/** Share of the band colour behind a step, in percent. */
const CARD_TINT = 10;

/** Share of the band colour behind the empty part of the bar, in percent. */
const TRACK_TINT = 20;

/**
 * Four columns from `md`; under it the variable takes the whole first row and
 * value, points and plan share the second, so a long variable name never
 * squeezes the figures on a phone.
 */
const COLUMNS =
  'md:grid-cols-[minmax(0,1fr)_256px_128px_150px] md:gap-6' as const;

/** The grid every step shares with the header above it. */
const ROW_CLASS = `grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-3 ${COLUMNS}`;

/** The variable cell spans the row under `md`. */
const NAME_CLASS = 'col-span-3 min-w-0 md:col-span-1';

/**
 * Renders one step: the variable, the figure behind it, the points it holds
 * and its plan.
 *
 * The step is a card washed with the band of its score, not a boxed row: the
 * wash groups the four readings, so no hairline is drawn around or between
 * them. The bar is the points of the step over the points of the largest one,
 * so the first card is always full and the rest are read against it; its
 * colour is the band of the score, never a decorative accent.
 *
 * @param props - The step and the company it belongs to.
 * @returns One card of the table.
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
      className={`${ROW_CLASS} mb-3 rounded-lg p-6 last:mb-0`}
      style={{ background: bandTint(step.score, CARD_TINT) }}
    >
      <span className={NAME_CLASS}>
        <b className="flex items-center gap-2 text-[20px] leading-[1.35] font-semibold tracking-[-0.01em]">
          {step.rank}. {step.label}
          <VariableInfoMark
            variableKey={step.key}
            label={step.label}
            weight={step.weight}
          />
        </b>
        <span className="text-ink-secondary mt-0.5 inline-flex items-center gap-2 text-[15px] leading-[1.55]">
          <i
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: step.band.color }}
          />
          {step.pillarLabel}
        </span>
        <span
          className="mt-3 block h-2 max-w-[320px] rounded"
          style={{ background: bandTint(step.score, TRACK_TINT) }}
        >
          <span
            className="block h-full rounded"
            style={{
              width: `${Math.round(step.share * 100)}%`,
              background: step.band.color,
            }}
          />
        </span>
      </span>
      <span className="flex items-center gap-1.5 text-[17px] leading-[1.35] font-semibold tabular-nums">
        {formatRawValue(step.rawValue, step.unit)}
        <InfoTip label={`el valor de ${step.label}`}>
          Score {formatNumber(step.score)} sobre 100.
        </InfoTip>
      </span>
      <b className="text-left text-[17px] leading-[1.1] font-semibold tracking-[-0.01em] tabular-nums whitespace-nowrap md:text-right md:text-[20px]">
        +{formatNumber(step.points, 2)}
        <span className="text-ink-secondary text-[13px] font-normal"> pts</span>
      </b>
      <span className="text-right">
        <Link
          href={companyActionRoute(companyId, step.key)}
          className="hover:text-link-accent text-[15px] leading-none font-medium whitespace-nowrap md:text-[17px]"
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
 * the month is actually decided. The header names the real weight of the month
 * in the formula, because the denominator changes with the data that arrived.
 *
 * @param props - The ranked steps and the company they belong to.
 * @returns The cards of the steps with the note about the variables without data.
 */
export function PulseGapTable({ board, companyId }: GapTableProps) {
  return (
    <div>
      <div
        className={`border-hairline text-ink-secondary mb-3 hidden items-end border-b px-6 pt-2 pb-3 text-sm leading-[1.2] font-medium md:grid ${COLUMNS}`}
      >
        <span className="flex items-center gap-1.5">
          Variable
          <InfoTip label="Variable">
            Una de las once variables del modelo.
          </InfoTip>
        </span>
        <span className="flex items-center gap-1.5">
          Valor
          <InfoTip label="Valor">
            El dato real de tu empresa este mes, no el score.
          </InfoTip>
        </span>
        <span className="flex items-center justify-end gap-1.5">
          Mejora puntos
          <InfoTip label="Mejora puntos">
            Puntos de PULSE que ganarías si esta variable llegase a 100. Es peso
            × (100 − score) / {formatNumber(board.knownWeight)}.
          </InfoTip>
        </span>
        <span className="text-right">Próximo paso</span>
      </div>
      <ul>
        {board.steps.map((step) => (
          <GapRow key={step.key} step={step} companyId={companyId} />
        ))}
      </ul>
      {board.blindNote && (
        <p className="border-hairline text-ink-secondary mt-5 border-t pt-4 text-[13px] leading-[1.45]">
          {board.blindNote}
        </p>
      )}
    </div>
  );
}
