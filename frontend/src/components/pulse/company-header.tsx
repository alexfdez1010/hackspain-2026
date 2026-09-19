import { BandRuler } from '@/components/charts/band-ruler';
import { ScoreBadge } from '@/components/ui/score-badge';
import { StatGrid } from '@/components/ui/stat-grid';
import {
  buildHeaderStats,
  type PulseHeaderInput,
} from '@/lib/pulse/header-stats';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import { formatMonth, formatNumber } from '@/lib/format';

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
 * @param props - The company, its customers' health and its cash.
 * @returns The headline score, the ruler and the four qualifiers.
 */
export function PulseCompanyHeader(props: PulseHeaderInput) {
  const { company } = props;
  return (
    <div className="flex flex-col gap-10">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="flex flex-wrap items-end gap-5">
          <b className="text-[60px] font-semibold leading-[0.92] tabular-nums tracking-[-0.025em] sm:text-[96px]">
            {company.pulse === null
              ? UNKNOWN_TEXT
              : formatNumber(company.pulse, 1)}
          </b>
          <span className="pb-3">
            <span className="mb-2 block">
              <ScoreBadge score={company.pulse} variant="pill" />
            </span>
            <span className="block text-[13px] text-ink-secondary">
              PULSE del cierre de {formatMonth(company.month)}
            </span>
          </span>
        </div>
        <BandRuler value={company.pulse} previous={company.pulsePrev} />
      </div>
      <StatGrid items={buildHeaderStats(props)} columns={4} />
    </div>
  );
}
