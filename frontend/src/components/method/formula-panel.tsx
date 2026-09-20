import { formatNumber } from '@/lib/format';

/** Each line that defines the score, with what it says in everyday words. */
const FORMULAS: readonly { formula: string; plain: string }[] = [
  {
    formula: 'PULSE = Σ(peso · score) / Σ(pesos con dato)',
    plain:
      'La nota final es la media de las notas, contando cada una tantas veces como puntos tiene, y solo con las que tienen dato.',
  },
  {
    formula: 'aporte = peso · score / Σ(pesos con dato)',
    plain: 'Lo que cada variable pone en la nota final.',
  },
  {
    formula: 'confianza = Σ(pesos con dato) / 100',
    plain: 'Cuántos de los 100 puntos tenían datos.',
  },
];

interface MethodFormulaPanelProps {
  /** Number of variables the score averages. */
  variables: number;
}

/**
 * States the calculation in three lines, each translated to plain words, and
 * says what follows from them.
 *
 * The base of the average is the weight that has evidence, not the full 100
 * points: that single choice is why the contributions add up to the score of
 * the month and why a variable without data never enters it as a zero.
 *
 * @param props - How many variables the score averages.
 * @returns The formula box with its translations.
 */
export function MethodFormulaPanel({ variables }: MethodFormulaPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[17px] leading-[1.6] text-ink-secondary">
        El PULSE es la media de las {formatNumber(variables)} variables
        ponderada por su peso, calculada solo sobre las que tienen dato ese mes:
      </p>
      <dl className="flex flex-col gap-3 rounded-lg border border-hairline bg-deep p-5 text-[15px] leading-[1.5]">
        {FORMULAS.map((item) => (
          <div key={item.formula} className="flex flex-col gap-0.5">
            <dt>{item.formula}</dt>
            <dd className="text-[13px] leading-[1.45] text-ink-secondary">
              {item.plain}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-[15px] leading-[1.55] text-ink-secondary">
        De ahí sale que los aportes sumen exactamente el PULSE del mes, y que
        una variable sin dato no cuente como un cero: su peso se reparte entre
        las demás y la confianza baja para decirlo.
      </p>
    </div>
  );
}
