import { VariableInfoLayer } from '@/components/charts/variable-info-layer';
import { MethodWeightCell } from '@/components/method/weight-cell';
import type { MethodWeightMap } from '@/lib/method/weights';
import { formatNumber } from '@/lib/format';

/** Props shared by the column and the row drawings of the weight map. */
export interface MethodWeightTreemapProps {
  map: MethodWeightMap;
  /** Key of the variable the detail panel is showing. */
  selectedKey: string;
  /** Called on hover, focus, click and Enter/Space. */
  onSelect: (key: string) => void;
}

/**
 * Draws the 100 points of the score as a treemap: one column per pillar, one
 * cell per variable, every area proportional to the points it owns.
 *
 * @param props - The layout, the selected variable and the selection handler.
 * @returns The pillar header and the treemap with an info button per cell.
 */
export function MethodWeightTreemap({
  map,
  selectedKey,
  onSelect,
}: MethodWeightTreemapProps) {
  const gap =
    map.groups.length > 1
      ? map.groups[1].x - (map.groups[0].x + map.groups[0].width)
      : 0;
  const percent = (value: number) => `${(value / map.width) * 100}%`;

  return (
    <div className="flex flex-col gap-2">
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
            <span className="block tabular-nums text-muted">
              {formatNumber(group.weight)} de {formatNumber(map.totalWeight)}
            </span>
          </div>
        ))}
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${map.width} ${map.height}`}
          className="h-auto w-full"
          role="group"
          aria-label="Reparto de los 100 puntos entre pilares y variables"
        >
          {map.segments.map((segment) => (
            <MethodWeightCell
              key={segment.key}
              segment={segment}
              total={map.totalWeight}
              active={segment.key === selectedKey}
              onSelect={onSelect}
            />
          ))}
        </svg>
        <VariableInfoLayer
          cells={map.segments}
          width={map.width}
          height={map.height}
        />
      </div>
    </div>
  );
}
