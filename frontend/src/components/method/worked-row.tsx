import type { MethodWorkedRow } from '@/lib/method/worked';
import { formatMonth, formatNumber, formatPercent } from '@/lib/format';

interface MethodWorkedRowProps {
  worked: MethodWorkedRow;
}

/**
 * Repeats the arithmetic of one variable with a calculator: its points, the
 * share those points had that month and the points of PULSE they became.
 *
 * @param props - The variable and its figures.
 * @returns The three steps and the sentence that closes them.
 */
export function MethodWorkedRow({ worked }: MethodWorkedRowProps) {
  const share = formatPercent(worked.share, 1);
  const steps = [
    `${worked.label} vale ${formatNumber(worked.weight)} de los 100 puntos.`,
    `En ${formatMonth(worked.month)} hubo datos para ${formatNumber(worked.knownWeight)} puntos, así que esos ${formatNumber(worked.weight)} pesan ${formatNumber(worked.weight)} ÷ ${formatNumber(worked.knownWeight)} = ${share} de la nota.`,
    `Su nota fue ${formatNumber(worked.score, 1)}. ${formatNumber(worked.score, 1)} × ${share} = ${formatNumber(worked.contribution, 1)} puntos de PULSE.`,
  ];
  return (
    <div className="flex max-w-[720px] flex-col gap-4">
      <h3 className="text-xl font-semibold leading-[1.3]">
        Una variable, hecha con calculadora
      </h3>
      <ol className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <li
            key={step}
            className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 text-[15px] leading-[1.55]"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-deep text-[13px] font-medium tabular-nums">
              {formatNumber(index + 1)}
            </span>
            <span className="pt-0.5 tabular-nums">{step}</span>
          </li>
        ))}
      </ol>
      <p className="text-[15px] leading-[1.55] text-ink-secondary">
        Se hace lo mismo con las otras {formatNumber(worked.others)} variables
        con datos y se suman los aportes
        {worked.pulse !== null
          ? `: ${formatNumber(worked.pulse, 1)}. Esa suma es el PULSE del mes.`
          : '. Esa suma es el PULSE del mes.'}
      </p>
    </div>
  );
}
