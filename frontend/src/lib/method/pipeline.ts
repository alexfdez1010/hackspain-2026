import { companyName } from '@/lib/company/names';
import type { MethodExample } from '@/lib/method/example';
import type { MethodWorkedRow } from '@/lib/method/worked';
import { formatRawValue } from '@/lib/pulse/format';
import { scoreBand } from '@/lib/score';
import { formatMonth, formatNumber, formatPercent } from '@/lib/format';

/** One step of the calculation that turns raw files into a published score. */
export interface MethodPipelineStep {
  /** Position of the step, printed as its marker. */
  number: number;
  title: string;
  /** What the step does, in plain words. */
  detail: string;
  /** Drawing that goes with the step. */
  art: 'inbox' | 'podium' | 'balance' | 'calculator';
}

/**
 * The four steps between the data a company shares and its PULSE of the month,
 * in the order the backend runs them and in words that need no finance.
 */
export const METHOD_PIPELINE: readonly MethodPipelineStep[] = [
  {
    number: 1,
    title: 'Juntamos los datos',
    detail:
      'Lo que la empresa ya comparte con Embat: qué entra y sale del banco, qué facturas ha enviado y cuáles debe. Nada externo.',
    art: 'inbox',
  },
  {
    number: 2,
    title: 'Cada variable recibe una nota',
    detail:
      'De 0 a 100, comparando con las demás empresas. Más alto siempre es más sano, aunque la cifra de detrás sea «menos días».',
    art: 'podium',
  },
  {
    number: 3,
    title: 'Cada nota vale sus puntos',
    detail: 'Una variable de 12 puntos cuenta el doble que una de 6.',
    art: 'balance',
  },
  {
    number: 4,
    title: 'Sumamos y decimos con cuántos datos',
    detail:
      'La suma de los aportes es el PULSE. Si falta un dato no cuenta como un cero: sale de la cuenta y la confianza avisa.',
    art: 'calculator',
  },
];

/**
 * Tells each step with the figures of the worked month, so the reader sees the
 * same numbers move from one step to the next.
 *
 * @param example - Worked month of the page; `null` when the export has none.
 * @param worked - Variable whose arithmetic the page repeats.
 * @param variables - Variables the score averages.
 * @returns One sentence per step, `null` where the month cannot tell it.
 */
export function buildPipelineExamples(
  example: MethodExample | null,
  worked: MethodWorkedRow | null,
  variables: number,
): (string | null)[] {
  if (!example) return METHOD_PIPELINE.map(() => null);
  const who = `${companyName(example.companyId)}, ${formatMonth(example.month)}`;
  const raw = example.rows[0];
  return [
    `${who}: ${formatNumber(example.rows.length)} de las ${formatNumber(variables)} variables tenían datos.`,
    worked && raw
      ? `${worked.label}: ${formatRawValue(raw.rawValue, raw.unit)} → nota ${formatNumber(worked.score, 1)}.`
      : null,
    worked
      ? `${worked.label}: ${formatNumber(worked.weight)} de los ${formatNumber(worked.knownWeight)} puntos con datos, así que su ${formatNumber(worked.score, 1)} aporta ${formatNumber(worked.contribution, 1)} al PULSE.`
      : null,
    example.pulse === null
      ? null
      : `${formatNumber(example.rows.length)} aportes suman ${formatNumber(example.contributionSum, 1)} → PULSE ${formatNumber(example.pulse, 1)}, ${scoreBand(example.pulse).name}, con ${formatPercent(example.confidence, 0)} de los puntos con datos.`,
  ];
}
