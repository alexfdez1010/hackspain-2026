import { ScoreBadge } from '@/components/ui/score-badge';
import { StatGrid, type StatItem } from '@/components/ui/stat-grid';
import { formatConfidence, formatConfidencePoints } from '@/lib/pulse/format';
import type { PulseCompany } from '@/lib/pulse/types';
import { formatMonth, formatNumber, formatSigned } from '@/lib/format';
import { scoreBand } from '@/lib/score';

interface PulseCompanyHeaderProps {
  company: PulseCompany;
}

/**
 * Opens the company view with the score, its monthly move and how much of it
 * rests on observed data.
 *
 * Confidence is shown next to the score because both are needed to act: a 32
 * backed by 82 points of data is a decision, the same 32 backed by 40 is a
 * request for information.
 *
 * @param props - The company being viewed.
 * @returns The headline score and its four qualifiers.
 */
export function PulseCompanyHeader({ company }: PulseCompanyHeaderProps) {
  const band = scoreBand(company.pulse);
  const firstMonth = company.series[0]?.month ?? '';
  const change =
    company.pulse !== null && company.pulsePrev !== null
      ? company.pulse - company.pulsePrev
      : null;
  const items: StatItem[] = [
    {
      key: 'change',
      label: 'Variación vs mes anterior',
      value: formatSigned(change),
      hint:
        company.pulsePrev === null
          ? 'Sin mes anterior observado'
          : `Desde ${formatNumber(company.pulsePrev, 1)} puntos`,
    },
    {
      key: 'confidence',
      label: 'Confianza',
      value: formatConfidence(company.confidence),
      hint: formatConfidencePoints(company.confidence),
    },
    {
      key: 'months',
      label: 'Meses observados',
      value: formatNumber(company.monthsObserved),
      hint: firstMonth ? `Desde ${formatMonth(firstMonth)}` : '',
    },
    {
      key: 'group',
      label: 'Grupo',
      value: company.groupId || '—',
      hint: 'Unidad de validación cruzada del modelo',
    },
  ];

  return (
    <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
      <div className="flex flex-col gap-1">
        <ScoreBadge score={company.pulse} size="lg" />
        <p className="text-sm text-muted">
          PULSE del último cierre
          {company.month ? `, ${formatMonth(company.month)}` : ''} ·{' '}
          {band.label}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <StatGrid items={items} columns={4} />
      </div>
    </div>
  );
}
