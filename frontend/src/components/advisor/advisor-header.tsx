import { ScoreBadge } from '@/components/ui/score-badge';
import { StatGrid, type StatItem } from '@/components/ui/stat-grid';
import { formatRate } from '@/lib/advisor/format';
import type { AdvisorCompany } from '@/lib/advisor/types';
import { formatMonth, formatPercent } from '@/lib/format';
import { formatConfidence, formatConfidencePoints } from '@/lib/pulse/format';
import { scoreBand } from '@/lib/score';

/** Where the reference rate of this answer comes from. */
const RATE_SOURCE_LABELS: Record<string, string> = {
  default: 'Valor por defecto del export',
  request: 'Indicado al pedir la propuesta',
};

interface AdvisorHeaderProps {
  company: AdvisorCompany;
}

/**
 * Opens the advisor with the four figures every offer below is built on: the
 * score, how much of it rests on data, the probability of stress the price
 * charges for and the rate the spread is quoted over.
 *
 * @param props - The company being advised.
 * @returns The headline figures of the page.
 */
export function AdvisorHeader({ company }: AdvisorHeaderProps) {
  const { risk, referenceRate } = company;
  const items: StatItem[] = [
    {
      key: 'pulse',
      label: 'PULSE',
      value: <ScoreBadge score={company.pulse} />,
      hint: `${formatMonth(company.month)} · ${scoreBand(company.pulse).label}`,
    },
    {
      key: 'confidence',
      label: 'Confianza',
      value: formatConfidence(company.confidence),
      hint: formatConfidencePoints(company.confidence),
    },
    {
      key: 'stress',
      label: 'Probabilidad de tensión a 6 meses',
      value: formatPercent(risk.pStress6m, 0),
      hint: `Cartera ${formatPercent(risk.baseRate, 0)}`,
    },
    {
      key: 'reference',
      label: referenceRate.label,
      value: formatRate(referenceRate.value),
      hint: RATE_SOURCE_LABELS[referenceRate.source] ?? referenceRate.source,
    },
  ];
  return <StatGrid items={items} columns={4} />;
}
