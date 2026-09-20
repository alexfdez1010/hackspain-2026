import { buildVariableRows } from '@/lib/pulse/company-view';
import { buildPointsExample } from '@/lib/pulse/points-example';
import type { PulseSeriesPoint, PulseVariableMeta } from '@/lib/pulse/types';
import { formatCount } from '@/lib/format';

interface PulsePointsExampleProps {
  /** Variable metadata of the export. */
  variables: readonly PulseVariableMeta[];
  /** Month the example is worked through; normally the last close. */
  point: PulseSeriesPoint | null;
  /** Companies in the export, which are the ruler every score is read on. */
  companies: number;
}

/**
 * Closes «Mes a mes» by turning one row of the tables into arithmetic.
 *
 * The two tables above give the reader eleven scores and eleven contributions
 * without ever saying how one becomes the other. This block says it once, with
 * the figures of the variable that contributed most in the close, so the step
 * from a real reading (days, euros, a share) to points of PULSE can be checked
 * by hand instead of taken on trust. The example sits on the deep surface,
 * which is what separates it from the tables: a border around it would repeat
 * a grouping the surface already makes.
 *
 * @param props - Variable metadata, the month to work through and the size of
 * the reference portfolio.
 * @returns The explanation with its worked example, or `null` when the month
 * measured no variable.
 */
export function PulsePointsExample({
  variables,
  point,
  companies,
}: PulsePointsExampleProps) {
  /* The example never names the pillar of the variable, so the rows are built
     without the pillar labels. */
  const example = buildPointsExample(buildVariableRows(variables, point, {}));
  if (!example) return null;
  return (
    <>
      <h3 className="mb-2 mt-7 text-[15px] font-semibold leading-[1.55]">
        Cuántos puntos vale cada variable
      </h3>
      <p className="mb-4 text-[15px] leading-[1.55] text-ink-secondary">
        Primero el valor real se convierte en un score de 0 a 100 comparándolo
        con la cartera de {formatCount(companies)} pymes. Ese score se
        multiplica por el peso de la variable y se divide entre el peso total
        con dato. El resultado son los puntos que esa variable pone en el PULSE.
      </p>
      <div className="grid gap-2 rounded-lg bg-deep p-5 text-[15px] leading-[1.5]">
        <span className="text-ink-secondary">{example.reading}</span>
        <span>{example.arithmetic}</span>
        <span className="text-ink-secondary">{example.ceiling}</span>
      </div>
    </>
  );
}
