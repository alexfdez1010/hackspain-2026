import { VariableInfoLayer } from '@/components/charts/variable-info-layer';
import { MethodWeightCell } from '@/components/method/weight-cell';
import type { MethodWeightTreemapProps } from '@/components/method/weight-treemap';
import { formatNumber } from '@/lib/format';

/** Font size of the row headings, in viewBox units. */
const HEADING_SIZE = 12;
/** Distance from the heading baseline to the top of its row. */
const HEADING_GAP = 8;

/**
 * Draws the 100 points as one row per pillar, for a screen too narrow for
 * four columns side by side.
 *
 * The heading of every row names the pillar and its points inside the SVG,
 * so it scales with the cells and stays aligned with them at any width.
 *
 * @param props - The stacked layout, the selected variable and the handler.
 * @returns The rows with an info button per cell.
 */
export function MethodWeightRows({
  map,
  selectedKey,
  onSelect,
}: MethodWeightTreemapProps) {
  return (
    <div className="relative max-w-sm">
      <svg
        viewBox={`0 0 ${map.width} ${map.height}`}
        className="h-auto w-full"
        role="group"
        aria-label="Reparto de los 100 puntos entre pilares y variables"
      >
        {map.groups.map((group) => (
          <g key={group.key}>
            <text
              x={group.x}
              y={group.y - HEADING_GAP}
              fill="var(--foreground)"
              style={{ fontSize: HEADING_SIZE, fontWeight: 500 }}
            >
              {group.label}
            </text>
            <text
              x={group.x + group.width}
              y={group.y - HEADING_GAP}
              textAnchor="end"
              fill="var(--muted)"
              className="tabular-nums"
              style={{ fontSize: HEADING_SIZE }}
            >
              {formatNumber(group.weight)} de {formatNumber(map.totalWeight)}
            </text>
          </g>
        ))}
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
  );
}
