import { companyName } from '@/lib/company/names';
import type { MethodExample } from '@/lib/method/example';
import { formatRawValue } from '@/lib/pulse/format';
import type { PulseMeta } from '@/lib/pulse/types';
import { scoreBand } from '@/lib/score';
import { formatMonth, formatNumber } from '@/lib/format';

/** One of the three drawings that tell the whole method at a glance. */
export interface MethodIdeaPanel {
  key: string;
  title: string;
  /** The idea, in one or two plain sentences. */
  text: string;
  /** The same idea with the figures of the worked month; `null` without one. */
  example: string | null;
  art: 'eleven' | 'report' | 'gauge';
}

/** Variable the second drawing prefers to quote, the easiest one to picture. */
const SIGNATURE_VARIABLE = 'cash_days';

/**
 * Builds the three-panel summary of the method with the figures of the
 * worked month, so the first thing a reader sees is already a real case.
 *
 * @param meta - Metadata of the export.
 * @param example - Worked month of the page; `null` when the export has none.
 * @param companies - Companies the score compares against.
 * @returns The three panels, in reading order.
 */
export function buildIdeaPanels(
  meta: PulseMeta,
  example: MethodExample | null,
  companies: number,
): MethodIdeaPanel[] {
  const variables = formatNumber(meta.variables.length);
  const who = example ? companyName(example.companyId) : null;
  const month = example ? formatMonth(example.month) : null;
  const quoted =
    example?.rows.find((row) => row.key === SIGNATURE_VARIABLE) ??
    example?.rows[0] ??
    null;
  return [
    {
      key: 'eleven',
      title: `Miramos ${variables} cosas`,
      text: `${variables} preguntas sencillas sobre el dinero de la empresa, agrupadas en ${formatNumber(meta.pillars.length)} temas: ¿hay dinero en el banco?, ¿debe mucho?, ¿paga a tiempo?, ¿le pagan a tiempo?`,
      example: example
        ? `En ${month}, ${who} tenía respuesta a ${formatNumber(example.rows.length)} de las ${variables}.`
        : null,
      art: 'eleven',
    },
    {
      key: 'report',
      title: 'Cada cosa recibe una nota de 0 a 100',
      text: `Como en una carrera con ${formatNumber(companies)} empresas: 100 es ir la primera y 0 la última. Más alto siempre es mejor.`,
      example:
        quoted && quoted.score !== null
          ? `${quoted.label} de ${who}: ${formatRawValue(quoted.rawValue, quoted.unit)} → nota ${formatNumber(quoted.score, 1)}.`
          : null,
      art: 'report',
    },
    {
      key: 'gauge',
      title: 'Se mezclan las notas y sale un solo número',
      text: 'Cada nota cuenta más o menos según su importancia, como el examen final frente a los deberes. Esa mezcla es el PULSE.',
      example:
        example && example.pulse !== null
          ? `Sus ${formatNumber(example.rows.length)} notas dan un PULSE de ${formatNumber(example.pulse, 1)}: ${scoreBand(example.pulse).name}.`
          : null,
      art: 'gauge',
    },
  ];
}
