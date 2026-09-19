import type { MethodFact } from '@/lib/method/facts';
import { pillarOrderIndex } from '@/lib/pulse/mosaic';
import type { PulseCompany, PulseMeta } from '@/lib/pulse/types';
import { formatMonth, formatNumber } from '@/lib/format';

/**
 * Counts the variables of the last observed month that carry no evidence.
 *
 * @param company - Company being read.
 * @returns How many variables the month is missing.
 */
function unknownInLastMonth(company: PulseCompany): number {
  const last = company.series[company.series.length - 1];
  if (!last) return 0;
  return Object.values(last.variables).filter((value) => !value.known).length;
}

/**
 * States the model in facts: how many variables it has, how the 100 points are
 * split, which months it read and how far it predicts.
 *
 * Everything comes from the export itself, so the card cannot drift from the
 * model it describes: change a weight upstream and this card changes with it.
 *
 * @param meta - Published metadata of the score.
 * @param company - Company being read, for its own window.
 * @returns The lines of the model card, in reading order.
 */
export function buildModelFacts(
  meta: PulseMeta,
  company: PulseCompany,
): MethodFact[] {
  const weights = [...meta.pillars]
    .sort((a, b) => pillarOrderIndex(a.key) - pillarOrderIndex(b.key))
    .map((pillar) => formatNumber(pillar.weight))
    .join(' · ');
  const firstMonth = company.series[0]?.month ?? '';
  const horizonMonth =
    company.forecast[company.forecast.length - 1]?.targetMonth ?? '';
  const months = company.forecast.length;
  const unknown = unknownInLastMonth(company);
  return [
    {
      key: 'variables',
      label: 'Variables',
      value: `${formatNumber(meta.variables.length)} en ${formatNumber(meta.pillars.length)} pilares`,
    },
    { key: 'weights', label: 'Pesos por pilar', value: `${weights} de 100` },
    {
      key: 'window',
      label: 'Ventana observada',
      value: firstMonth
        ? `${formatMonth(firstMonth)} – ${formatMonth(company.month)}`
        : 'Sin meses observados',
    },
    {
      key: 'horizon',
      label: 'Horizonte de previsión',
      value: horizonMonth
        ? `${formatNumber(months)} meses, hasta ${formatMonth(horizonMonth)}`
        : 'Sin previsión publicada',
    },
    {
      key: 'unknown',
      label: `Sin dato en ${formatMonth(company.month)}`,
      value: `${formatNumber(unknown)} de ${formatNumber(meta.variables.length)} variables`,
    },
  ];
}
