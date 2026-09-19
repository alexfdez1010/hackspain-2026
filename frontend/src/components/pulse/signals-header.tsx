import { StatGrid, type StatItem } from '@/components/ui/stat-grid';
import type { SignalsView } from '@/lib/pulse/signals-view';
import type { PulseCompany } from '@/lib/pulse/types';
import { formatMonth, formatNumber } from '@/lib/format';

interface PulseSignalsHeaderProps {
  company: Pick<PulseCompany, 'month' | 'pulse' | 'monthsObserved'>;
  view: SignalsView;
}

/**
 * Headline counts of the signals page: what is open, what stayed in each
 * direction and how often the name given at the time matched the outcome.
 *
 * @param props - The company and its split signals.
 * @returns A grid of four figures.
 */
export function PulseSignalsHeader({ company, view }: PulseSignalsHeaderProps) {
  const settled = view.settled.length;
  const items: StatItem[] = [
    {
      key: 'open',
      label: 'Alertas abiertas',
      value: formatNumber(view.open.length),
      hint: company.month
        ? `Último cierre, ${formatMonth(company.month)}`
        : 'Sin mes observado',
    },
    {
      key: 'falls',
      label: 'Caídas confirmadas',
      value: formatNumber(view.confirmedFalls),
      hint: 'Bajadas que seguían tres meses después',
    },
    {
      key: 'rises',
      label: 'Mejoras confirmadas',
      value: formatNumber(view.confirmedRises),
      hint: 'Subidas que seguían tres meses después',
    },
    {
      key: 'calls',
      label: 'Aciertos al abrirse',
      value:
        settled > 0
          ? `${formatNumber(view.rightCalls)} de ${formatNumber(settled)}`
          : '—',
      hint: 'Bache o caída dicho el primer mes y confirmado después',
    },
  ];
  return <StatGrid items={items} columns={4} />;
}
