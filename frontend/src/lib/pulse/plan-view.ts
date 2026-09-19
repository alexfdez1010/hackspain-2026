import { UNKNOWN_TEXT, formatRawValue } from '@/lib/pulse/format';
import type { PulseMosaicCell } from '@/lib/pulse/mosaic';
import { planFor, type PulsePlan } from '@/lib/pulse/plans';
import { formatNumber } from '@/lib/format';

/** One figure of the strip that heads a plan. */
export interface PulsePlanFigure {
  key: string;
  label: string;
  value: string;
}

/** Everything the recommendation page of one variable renders. */
export interface PulsePlanView {
  plan: PulsePlan;
  /** Points of PULSE the variable would add by reaching 100. */
  points: number;
  /** Why this variable and not another one, in the figures of the month. */
  why: string;
  /** Score today, points at stake, cost and horizon. */
  figures: PulsePlanFigure[];
}

/**
 * Builds the plan of one variable for one month.
 *
 * The «por qué» is written from the month itself — score, weight, measured
 * value — so the recommendation is never a generic piece of advice: it names
 * the figure that puts the variable at the top of the list.
 *
 * @param cell - The variable of the month, as the mosaic lays it out.
 * @param knownWeight - Points of weight backed by data this month.
 * @returns The plan, the points at stake, the reason and the figures.
 */
export function buildPulsePlanView(
  cell: PulseMosaicCell,
  knownWeight: number,
): PulsePlanView {
  const plan = planFor(cell.key);
  const measured = cell.known && cell.score !== null && knownWeight > 0;
  const points = measured
    ? (cell.weight * (100 - (cell.score as number))) / knownWeight
    : 0;
  const why = measured
    ? `${cell.label} está en ${formatNumber(cell.score)} sobre 100 y pesa ` +
      `${formatNumber(cell.weight)} de ${formatNumber(knownWeight)} puntos con dato. ` +
      `Su valor medido hoy es ${formatRawValue(cell.rawValue, cell.unit)}.`
    : `${cell.label} no tiene dato este mes, así que sus ${formatNumber(cell.weight)} ` +
      'puntos de peso se reparten entre las demás variables. Conectar su fuente no sube ' +
      'el PULSE por sí solo: mete esos puntos en el cálculo y con ellos su propio recorrido.';
  return {
    plan,
    points,
    why,
    figures: [
      {
        key: 'score',
        label: 'Score de hoy, sobre 100',
        value: measured ? formatNumber(cell.score) : UNKNOWN_TEXT,
      },
      {
        key: 'points',
        label: 'Si la variable llega a 100',
        value: `+${formatNumber(points, 2)} pts`,
      },
      { key: 'cost', label: 'Coste de la medida', value: plan.cost },
      {
        key: 'horizon',
        label: 'Cuándo se ve en el PULSE',
        value: plan.horizon,
      },
    ],
  };
}
