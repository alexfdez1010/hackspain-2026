import type { MethodExample } from '@/lib/method/example';
import type { PulseMeta } from '@/lib/pulse/types';
import { formatMonth, formatNumber } from '@/lib/format';

/** One row of the model card: a fact and the figure that states it. */
export interface MethodFact {
  key: string;
  label: string;
  value: string;
}

/** What the card needs beyond the published metadata. */
export interface MethodFactsContext {
  /** Companies the export publishes, the reference portfolio of the score. */
  companies: number;
  /** Furthest month the forecast reaches, in months. */
  lastHorizon: number;
  /** Worked month of the page; `null` when the export has none. */
  example: MethodExample | null;
  /** First observed month of that company, as `YYYY-MM`; `null` when none. */
  observedFrom: string | null;
}

/**
 * Builds the model card: the facts a reader needs to judge the score, and
 * nothing that comments on them.
 *
 * Every figure comes from the export — the weights, the close, the horizon and
 * the coverage of the worked month — so the card cannot drift from what the
 * backend actually published.
 *
 * @param meta - Metadata of the export.
 * @param context - Portfolio size, forecast horizon and worked month.
 * @returns The rows of the card, in reading order.
 */
export function buildModelFacts(
  meta: PulseMeta,
  { companies, lastHorizon, example, observedFrom }: MethodFactsContext,
): MethodFact[] {
  const facts: MethodFact[] = [
    {
      key: 'variables',
      label: 'Variables',
      value: `${formatNumber(meta.variables.length)} en ${formatNumber(meta.pillars.length)} pilares`,
    },
    {
      key: 'weights',
      label: 'Pesos por pilar',
      value: `${meta.pillars.map((pillar) => formatNumber(pillar.weight)).join(' · ')} de 100`,
    },
    {
      key: 'window',
      label: 'Ventana observada',
      value:
        observedFrom && example
          ? `${formatMonth(observedFrom)} – ${formatMonth(example.month)}`
          : formatMonth(meta.lastMonth),
    },
    {
      key: 'horizon',
      label: 'Horizonte de previsión',
      value: `${formatNumber(lastHorizon)} meses`,
    },
  ];
  if (example) {
    facts.push({
      key: 'missing',
      label: `Sin dato en ${formatMonth(example.month)}`,
      value: `${formatNumber(example.unknownLabels.length)} de ${formatNumber(meta.variables.length)} variables`,
    });
  }
  facts.push({
    key: 'portfolio',
    label: 'Cartera de referencia',
    value: `${formatNumber(companies)} empresas`,
  });
  return facts;
}
