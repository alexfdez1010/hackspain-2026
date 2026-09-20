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

/**
 * States the calculation in three lines, each translated to plain words. The
 * base of the average is the weight that has evidence, not the full 100
 * points: that single choice is why the contributions add up to the score of
 * the month and why a variable without data never enters it as a zero. The
 * page has said both already, so the box says only the formulas.
 *
 * @returns The three formulas with their translations.
 */
export function MethodFormulaPanel() {
  return (
    <dl className="flex max-w-[720px] flex-col gap-3 rounded-lg bg-deep p-5 text-[15px] leading-[1.5]">
      {FORMULAS.map((item) => (
        <div key={item.formula} className="flex flex-col gap-0.5">
          <dt>{item.formula}</dt>
          <dd className="text-[13px] leading-[1.45] text-ink-secondary">
            {item.plain}
          </dd>
        </div>
      ))}
    </dl>
  );
}
