import { FactGrid, type PulseFact } from '@/components/pulse/fact-grid';
import { Panel } from '@/components/ui/panel';
import { formatNumber } from '@/lib/format';
import type { PulseGap } from '@/lib/pulse/gap';
import { planFor } from '@/lib/pulse/plans';

/** Overline of the panel: it says what the reader is about to save. */
export const SOFT_ACTION_KICKER = 'Antes de financiar · sin coste';

/**
 * Writes why this variable and not another one.
 *
 * The sentence quotes the two figures the ranking is built on — the score and
 * the weight — so the reader can check that the largest gap really is the
 * largest, instead of trusting the order of the list.
 *
 * @param gap - The variable with the most points on the table.
 * @returns One paragraph naming the variable, its score and its weight.
 */
export function softActionReason(gap: PulseGap): string {
  return (
    `${gap.label} está en ${formatNumber(gap.score, 1)} sobre 100 y pesa ` +
    `${formatNumber(gap.weight)} de los 100 puntos del modelo, así que es la ` +
    `variable con más recorrido del cierre: llevarla a 100 sumaría ` +
    `${formatNumber(gap.points, 2)} puntos de PULSE sin consumir financiación.`
  );
}

interface SoftActionPanelProps {
  /** The variable with the most points of PULSE still on the table. */
  gap: PulseGap;
}

/**
 * What the company can do this month without signing anything: the operational
 * measure that moves the score most, with the points it is worth, what it
 * costs and when it would show.
 *
 * It opens the financing page on purpose: a measure that costs nothing has to
 * be read before the catalogue, so the product is offered only once the free
 * move has been dismissed.
 *
 * @param props - The largest gap of the last close.
 * @returns The panel with the action, its reason and its three figures.
 */
export function SoftActionPanel({ gap }: SoftActionPanelProps) {
  const plan = planFor(gap.key);
  const facts: PulseFact[] = [
    {
      key: 'points',
      value: `hasta +${formatNumber(gap.points, 2)} pts`,
      label: 'Efecto en el PULSE si la variable llega a 100',
    },
    {
      key: 'cost',
      value: plan.cost,
      label: 'Coste financiero de la medida',
    },
    {
      key: 'horizon',
      value: plan.horizon,
      label: 'Cuándo se ve en el PULSE',
    },
  ];
  return (
    <Panel>
      <p className="text-ink-secondary text-[13px] leading-[1.2] font-semibold tracking-[0.06em] uppercase">
        {SOFT_ACTION_KICKER}
      </p>
      <h3 className="mt-3 max-w-[28ch] text-2xl leading-[1.3] font-semibold">
        {plan.title}
      </h3>
      <p className="text-ink-secondary mt-3 max-w-[720px] text-[17px] leading-[1.6]">
        {softActionReason(gap)}
      </p>
      <div className="mt-5">
        <FactGrid items={facts} />
      </div>
    </Panel>
  );
}
