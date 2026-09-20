import type { ReactNode } from 'react';

import { BandRuler } from '@/components/charts/band-ruler';
import { InfoTip } from '@/components/ui/info-tip';
import { ScoreBadge } from '@/components/ui/score-badge';
import { StatGrid } from '@/components/ui/stat-grid';
import {
  buildHeaderStats,
  type PulseHeaderInput,
} from '@/lib/pulse/header-stats';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import { formatMonth, formatNumber } from '@/lib/format';

/**
 * What PULSE is, in the words the prototype hovers over the figure. The
 * headline number is the one thing every reader sees first and the only one
 * with no label of its own, so its definition sits behind the info button
 * beside the band pill instead of as a line of copy nobody needs twice.
 */
export const PULSE_TIP =
  'PULSE: nota de 0 a 100 de la salud financiera de la empresa. ' +
  'Es la media de once variables ponderada por el peso de cada una.';

interface PulseCompanyHeaderProps extends PulseHeaderInput {
  /**
   * Optional row rendered between the ruler and the KPI strip, which is where
   * the prototype puts the call to action. It is a slot so the header keeps
   * reading the company alone and never the ranking of gaps.
   */
  children?: ReactNode;
}

/**
 * Opens the company view: the score of the last close, where it sits on the
 * 0-100 scale and the four figures that qualify it.
 *
 * The ruler answers what the number alone cannot, which is distance: how far
 * the company is from the next band and how far it moved since last month.
 * Confidence sits in the same strip because both are needed to act — a 33
 * backed by 82 points of data is a decision, the same 33 backed by 40 is a
 * request for information.
 *
 * Every figure carries a plain-language definition behind an info button,
 * the score included: the strip stays four numbers wide and the explanation
 * costs no vertical space. Between the ruler and the strip the header leaves the slot
 * the prototype fills with the way out to «Acción».
 *
 * @param props - The company, its customers' health, its cash and the slot.
 * @returns The headline score, the ruler, the slot and the four qualifiers.
 */
export function PulseCompanyHeader({
  children,
  ...input
}: PulseCompanyHeaderProps) {
  const { company } = input;
  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-wrap items-end gap-5">
          <b className="text-[60px] font-semibold leading-[0.92] tabular-nums tracking-[-0.025em] sm:text-[96px]">
            {company.pulse === null
              ? UNKNOWN_TEXT
              : formatNumber(company.pulse, 1)}
          </b>
          <span className="pb-3">
            <span className="mb-2 flex items-center gap-2">
              <ScoreBadge score={company.pulse} variant="pill" />
              <InfoTip label="PULSE">{PULSE_TIP}</InfoTip>
            </span>
            <span className="block text-[13px] text-ink-secondary">
              PULSE del cierre de {formatMonth(company.month)}
            </span>
          </span>
        </div>
        <BandRuler value={company.pulse} previous={company.pulsePrev} />
      </div>
      <div className="flex flex-col gap-6">
        {children}
        <StatGrid items={buildHeaderStats(input)} columns={4} />
      </div>
    </div>
  );
}
