import { formatNumber } from '@/lib/format';

/** The three lines that define the score, its parts and its confidence. */
const FORMULAS: readonly string[] = [
  'PULSE = Σ(peso · score) / Σ(pesos con dato)',
  'aporte = peso · score / Σ(pesos con dato)',
  'confianza = Σ(pesos con dato) / 100',
];

interface MethodFormulaPanelProps {
  /** Number of variables the score averages. */
  variables: number;
}

/**
 * States the calculation in three lines and says what follows from them.
 *
 * The base of the average is the weight that has evidence, not the full 100
 * points: that single choice is why the contributions add up to the score of
 * the month and why a variable without data never enters it as a zero.
 *
 * @param props - How many variables the score averages.
 * @returns The formula box with its two sentences.
 */
export function MethodFormulaPanel({ variables }: MethodFormulaPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[17px] leading-[1.6] text-ink-secondary">
        El PULSE es la media de las {formatNumber(variables)} variables
        ponderada por su peso, calculada solo sobre las que tienen dato ese mes:
      </p>
      <div className="flex flex-col gap-2 rounded-lg border border-hairline bg-deep p-5 text-[15px] leading-[1.5]">
        {FORMULAS.map((formula) => (
          <span key={formula}>{formula}</span>
        ))}
      </div>
      <p className="text-[15px] leading-[1.55] text-ink-secondary">
        De ahí sale que los aportes sumen exactamente el PULSE del mes, y que
        una variable sin dato no cuente como un cero: su peso se reparte entre
        las demás y la confianza baja para decirlo.
      </p>
    </div>
  );
}
