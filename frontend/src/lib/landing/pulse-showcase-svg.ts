import { linePath, yAt, type ChartBox } from '@/components/charts/geometry';
import { formatMonth, formatMonthShort, formatNumber } from '@/lib/format';
import type { PulseTrajectoryPoint } from '@/lib/pulse/company-view';
import { layoutTrajectory } from '@/lib/pulse/trajectory-layout';
import { SCORE_GUIDES, scoreBand, type ScoreBandKey } from '@/lib/score';

/** Fixed viewBox for the marketing PULSE preview. Wider pads than the product chart. */
export const PULSE_SHOWCASE_BOX: ChartBox = {
  width: 720,
  height: 280,
  padLeft: 44,
  padRight: 52,
  padTop: 40,
  padBottom: 44,
};

/** Light-band score colours, baked so the SVG does not depend on CSS variables. */
const LIGHT_SCORE: Record<ScoreBandKey, string> = {
  critical: 'oklch(0.6 0.21 26)',
  fragile: 'oklch(0.72 0.15 72)',
  neutral: 'oklch(0.62 0.03 262)',
  solid: 'oklch(0.63 0.15 156)',
};

const SEPARATOR = '#d2d2db';
const FOREGROUND = '#050b2c';
const MUTED = '#6e707c';

/**
 * Escapes text for SVG attribute and text nodes.
 *
 * @param value - Raw string.
 * @returns XML-safe text.
 */
function xml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Rounds a coordinate so the serialized path stays compact.
 *
 * @param value - ViewBox unit.
 * @returns One decimal place.
 */
function n(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Accessible name of the marketing trajectory.
 *
 * @param points - Observed months followed by the forecast.
 * @param boundaryIndex - Last observed month.
 * @returns A Spanish label, or an empty string when there is no history.
 */
export function pulseShowcaseLabel(
  points: readonly PulseTrajectoryPoint[],
  boundaryIndex: number,
): string {
  if (points.length === 0 || boundaryIndex < 0) return '';
  const last = points[points.length - 1];
  return `PULSE mensual desde ${formatMonth(points[0].month)} hasta ${formatMonth(points[boundaryIndex].month)} y previsión hasta ${formatMonth(last.month)}`;
}

/**
 * Serializes a simplified PULSE trajectory as a standalone SVG string.
 *
 * No hover, tooltip or figcaption. Month labels only at the first close, the
 * last close and the farthest horizon. Colours are the light-band score tokens.
 * Returns an empty string when there is no observed history.
 *
 * @param points - Observed months followed by the forecast.
 * @param boundaryIndex - Last observed month.
 * @returns An SVG document, or `''`.
 */
export function pulseShowcaseSvg(
  points: readonly PulseTrajectoryPoint[],
  boundaryIndex: number,
): string {
  if (points.length === 0 || boundaryIndex < 0) return '';
  const box = PULSE_SHOWCASE_BOX;
  const layout = layoutTrajectory(points, boundaryIndex, box);
  const { placed, observed, projected, band } = layout;
  const last = placed[placed.length - 1];
  const boundary = placed[boundaryIndex];
  if (boundary.y === null) return '';
  const stroke = LIGHT_SCORE[scoreBand(boundary.value).key];
  const forecastStroke = LIGHT_SCORE[scoreBand(last.value).key];
  const observedPath = linePath(
    observed.map((point) => ({ x: n(point.x), y: n(point.y) })),
  );
  const forecastPath = linePath(
    projected.map((point) => ({ x: n(point.x), y: n(point.y) })),
  );
  const label = xml(pulseShowcaseLabel(points, boundaryIndex));
  const close = formatNumber(boundary.value, 1);
  const guides = SCORE_GUIDES.map((guide) => {
    const y = n(yAt(guide, 0, 100, box));
    return `<g><line x1="${box.padLeft}" x2="${box.width - box.padRight}" y1="${y}" y2="${y}" stroke="${SEPARATOR}" stroke-width="1"/><text x="0" y="${y + 3}" fill="${MUTED}" font-size="10">${guide}</text></g>`;
  }).join('');
  const ends = [0, boundaryIndex, placed.length - 1];
  const months = [...new Set(ends)].map((index) => {
    const point = placed[index];
    return `<text x="${n(point.x)}" y="${box.height - 10}" text-anchor="middle" fill="${MUTED}" font-size="11">${xml(formatMonthShort(point.month))}</text>`;
  });
  const horizon =
    last.y !== null && boundaryIndex < placed.length - 1
      ? `<circle cx="${n(last.x)}" cy="${n(last.y)}" r="3.2" fill="${forecastStroke}"/>`
      : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box.width} ${box.height}" width="100%" height="${box.height}" role="img" aria-label="${label}" font-family="DM Sans, sans-serif">
<g id="pulse-guides" aria-hidden="true">${guides}</g>
${band ? `<path id="pulse-band" d="${band}" fill="${forecastStroke}" fill-opacity="0.16"/>` : ''}
<path id="pulse-observed" d="${observedPath}" fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
<path id="pulse-forecast" d="${forecastPath}" fill="none" stroke="${forecastStroke}" stroke-width="2" stroke-dasharray="6 4" stroke-linejoin="round" stroke-linecap="round"/>
<line id="pulse-boundary" x1="${n(boundary.x)}" x2="${n(boundary.x)}" y1="${box.padTop}" y2="${box.height - box.padBottom}" stroke="${FOREGROUND}" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.45"/>
<text x="${n(boundary.x) + 6}" y="${box.padTop - 10}" fill="${MUTED}" font-size="11">previsión</text>
<g id="pulse-close">
<circle cx="${n(boundary.x)}" cy="${n(boundary.y)}" r="5" fill="${stroke}"/>
<text x="${n(boundary.x) - 8}" y="${n(boundary.y) - 12}" text-anchor="end" fill="${stroke}" font-size="13" font-weight="600">${xml(close)}</text>
</g>
${horizon}
${months.join('')}
</svg>`;
}
