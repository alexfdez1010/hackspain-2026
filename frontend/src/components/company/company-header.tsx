import { ScoreBadge } from '@/components/xray/score-badge';
import { StatGrid } from '@/components/xray/stat-grid';
import { DirectionTag, RegimeTag } from '@/components/xray/tags';
import { formatNumber, formatPercent, formatSigned } from '@/lib/xray/format';
import { REGIME_HINTS, scoreBand } from '@/lib/xray/score';
import type { Company } from '@/lib/xray/types';

interface CompanyHeaderProps {
  company: Company;
}

/**
 * Shows the current verdict on a company: level, movement and stability.
 *
 * @param props - The company being inspected.
 * @returns The headline score, its band, the tags and the four key figures.
 */
export function CompanyHeader({ company }: CompanyHeaderProps) {
  const band = scoreBand(company.score);
  const delta1m =
    company.score_prev === null ? null : company.score - company.score_prev;
  const delta6m =
    company.score_6m_ago === null ? null : company.score - company.score_6m_ago;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <div className="flex items-end gap-3">
          <ScoreBadge score={company.score} size="lg" />
          <span className="pb-1.5 text-sm text-muted">{band.label}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <DirectionTag direction={company.direction} />
          <RegimeTag regime={company.regime} />
        </div>
      </div>

      <p className="max-w-3xl text-muted">{REGIME_HINTS[company.regime]}</p>

      <StatGrid
        columns={4}
        items={[
          {
            key: 'delta1m',
            label: 'Variación 1 mes',
            value: formatSigned(delta1m),
            hint: 'puntos de score',
          },
          {
            key: 'delta6m',
            label: 'Variación 6 meses',
            value: formatSigned(delta6m),
            hint: 'puntos de score',
          },
          {
            key: 'trend',
            label: 'Tendencia Theil-Sen',
            value: formatSigned(company.trend_6m, 2),
            hint: 'puntos por mes',
          },
          {
            key: 'stress',
            label: 'Prob. de estrés',
            value: formatPercent(company.p_stress, 1),
            hint: `Próximos 6 meses · ${formatNumber(company.months_observed)} meses observados`,
          },
        ]}
      />
    </div>
  );
}
