import { formatNumber } from '@/lib/format';
import { formatHorizon } from '@/lib/pulse/format';
import type { PulseVariableForecast } from '@/lib/pulse/variable-forecast';

/**
 * Writes where the variable ranks among the ones with data this month.
 *
 * @param rank - Position by score, 1 first; `null` without data.
 * @param known - Variables with data this month.
 * @returns A phrase such as `3.ª de 9 con datos`.
 */
export function standingNote(rank: number | null, known: number): string {
  if (rank === null) return 'sin datos este mes';
  return `${formatNumber(rank)}.ª de ${formatNumber(known)} con datos`;
}

/**
 * Writes the horizon where the variable weighs most on the forecast.
 *
 * @param forecast - The forecast read from the side of the variable.
 * @returns A phrase naming the peak horizon, or the empty case.
 */
export function forecastNote(forecast: PulseVariableForecast): string {
  const { peak, rankAtFarthest, driverCount, farthest } = forecast;
  if (!peak || peak.points === null) return 'Sin previsión publicada';
  const rank =
    rankAtFarthest !== null && farthest
      ? `; ${formatNumber(rankAtFarthest)}.º de ${formatNumber(driverCount)} factores a ${formatHorizon(farthest.horizon)}`
      : '';
  return `Puntos de PULSE por horizonte; máximo a ${formatHorizon(peak.horizon)}${rank}`;
}
