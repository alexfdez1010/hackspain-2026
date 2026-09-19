import { formatMonth, formatSigned } from '@/lib/format';
import { formatHorizon, UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseVariableForecast } from '@/lib/pulse/variable-forecast';

/** Smallest scale of the bars, so a flat horizon is not blown up. */
const MIN_SCALE = 0.1;

interface VariableForecastChartProps {
  /** The forecast read from the side of one variable. */
  forecast: PulseVariableForecast;
}

/**
 * Draws what the variable adds to the predicted change at every horizon.
 *
 * Bars diverge around zero because a driver can push the score in either
 * direction, and every row keeps the total predicted change of its horizon
 * next to it: that is what turns the contribution into a share of the move
 * instead of an isolated figure.
 *
 * @param props - The forecast of the variable.
 * @returns The rows, or an empty state when the company has no forecast.
 */
export function VariableForecastChart({
  forecast,
}: VariableForecastChartProps) {
  const { impacts } = forecast;
  if (impacts.length === 0) {
    return (
      <p className="text-sm text-muted">
        Sin previsión publicada para esta empresa.
      </p>
    );
  }
  const scale = Math.max(
    ...impacts.map((impact) => Math.abs(impact.points ?? 0)),
    MIN_SCALE,
  );

  return (
    <figure className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2.5">
        {impacts.map((impact) => {
          const ratio =
            impact.points === null ? 0 : (Math.abs(impact.points) / scale) * 50;
          const positive = (impact.points ?? 0) >= 0;
          return (
            <li
              key={impact.horizon}
              className="grid grid-cols-[6rem_1fr_4.5rem_5rem] items-center gap-3 text-sm max-sm:grid-cols-[4.5rem_1fr_4rem_4rem]"
            >
              <span className="min-w-0">
                <span className="block tabular-nums">
                  {formatHorizon(impact.horizon)}
                </span>
                <span className="block truncate text-xs text-muted">
                  {formatMonth(impact.targetMonth)}
                </span>
              </span>
              {impact.points === null ? (
                <span className="text-xs text-muted">{UNKNOWN_TEXT}</span>
              ) : (
                <span className="relative block h-2">
                  <span className="absolute inset-y-0 left-1/2 w-px bg-separator" />
                  <span
                    className="absolute inset-y-0 rounded-sm"
                    style={{
                      width: `${ratio}%`,
                      left: positive ? '50%' : `${50 - ratio}%`,
                      backgroundColor: positive
                        ? 'var(--score-solid)'
                        : 'var(--score-critical)',
                    }}
                  />
                </span>
              )}
              <span className="text-right tabular-nums">
                {impact.points === null ? '' : formatSigned(impact.points, 2)}
              </span>
              <span className="text-right text-muted tabular-nums">
                {formatSigned(impact.delta, 1)}
              </span>
            </li>
          );
        })}
      </ul>
      <figcaption className="text-xs text-muted">
        Barra y cifra: puntos del cambio previsto que aporta la variable. Última
        columna: cambio total previsto del PULSE en ese horizonte.
      </figcaption>
    </figure>
  );
}
