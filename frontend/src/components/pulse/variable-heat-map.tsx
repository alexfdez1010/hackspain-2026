import { VariableInfoLayer } from '@/components/charts/variable-info-layer';
import { HeatCell } from '@/components/pulse/heat-cell';
import { PulseHeatRows } from '@/components/pulse/heat-rows';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import { stackHeatMap, type PulseHeatMap } from '@/lib/pulse/heat-map';
import { formatNumber } from '@/lib/format';
import { SCORE_BANDS } from '@/lib/score';

interface PulseVariableHeatMapProps {
  map: PulseHeatMap;
}

/**
 * The four pillar columns with their score on top of the map.
 *
 * @param props - The coloured layout of one month.
 * @returns The pillar header and the map with its info buttons.
 */
function HeatColumns({ map }: PulseVariableHeatMapProps) {
  const gap =
    map.groups.length > 1
      ? map.groups[1].x - (map.groups[0].x + map.groups[0].width)
      : 0;
  const percent = (value: number) => `${(value / map.width) * 100}%`;
  return (
    <div className="flex min-w-[48rem] flex-col gap-2 lg:min-w-0">
      <div className="flex w-full text-xs">
        {map.groups.map((group, index) => (
          <div
            key={group.key}
            className="min-w-0 pr-1"
            style={{
              width: percent(group.width),
              marginLeft: index === 0 ? 0 : percent(gap),
            }}
          >
            <span className="block font-medium leading-tight">
              {group.label}
            </span>
            <span
              className="block font-semibold tabular-nums"
              style={{ color: group.band.color }}
            >
              {group.score === null
                ? UNKNOWN_TEXT
                : `${formatNumber(group.score, 0)} · ${group.band.label}`}
            </span>
          </div>
        ))}
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${map.width} ${map.height}`}
          className="h-auto w-full"
          role="group"
          aria-label="Score de cada variable en el último cierre"
        >
          {map.cells.map((cell) => (
            <HeatCell key={cell.key} cell={cell} />
          ))}
        </svg>
        <VariableInfoLayer
          cells={map.cells}
          width={map.width}
          height={map.height}
        />
      </div>
    </div>
  );
}

/**
 * The eleven variables of the last close as a heat map: the area of a cell is
 * the weight of the variable and its colour is the band of its score, green
 * where the company is strong and red where it is losing points.
 *
 * Wide screens get the four pillars as columns; under `md` the same cells are
 * laid out as one row per pillar, so the map fits a phone without scrolling
 * sideways. Every cell carries an info button that explains the variable.
 *
 * @param props - The coloured layout of one month.
 * @returns The map in both layouts and the legend.
 */
export function PulseVariableHeatMap({ map }: PulseVariableHeatMapProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="hidden overflow-x-auto md:block">
        <HeatColumns map={map} />
      </div>
      <div className="md:hidden">
        <PulseHeatRows map={stackHeatMap(map)} />
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {SCORE_BANDS.map((band) => (
          <li key={band.key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-sm"
              style={{ background: band.color }}
            />
            {band.label}
          </li>
        ))}
        {map.unknownCount > 0 && (
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-sm border border-dashed border-muted"
            />
            {formatNumber(map.unknownCount)} sin datos
          </li>
        )}
      </ul>
    </div>
  );
}
