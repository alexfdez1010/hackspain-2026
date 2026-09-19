import { VariableInfoLayer } from '@/components/charts/variable-info-layer';
import { HeatCell } from '@/components/pulse/heat-cell';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseHeatMap } from '@/lib/pulse/heat-map';
import { formatNumber } from '@/lib/format';
import { companyVariableRoute } from '@/lib/routes';

/** Font size of the row headings, in viewBox units. */
const HEADING_SIZE = 12;
/** Distance from the heading baseline to the top of its row. */
const HEADING_GAP = 8;

interface PulseHeatRowsProps {
  /** The heat map already laid out as rows. */
  map: PulseHeatMap;
  /** Company whose variable pages the cells link to; without it they are inert. */
  companyId?: string;
}

/**
 * The heat map as one row per pillar, for a screen too narrow for four
 * columns side by side.
 *
 * The heading of every row names the pillar and its score inside the SVG, so
 * it scales with the cells and stays aligned with them at any width.
 *
 * @param props - The stacked layout of one month and the company in context.
 * @returns The rows with an info button per cell.
 */
export function PulseHeatRows({ map, companyId }: PulseHeatRowsProps) {
  return (
    <div className="relative max-w-sm">
      <svg
        viewBox={`0 0 ${map.width} ${map.height}`}
        className="h-auto w-full"
        role="group"
        aria-label="Score de cada variable en el último cierre"
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
              fill={group.band.color}
              className="tabular-nums"
              style={{ fontSize: HEADING_SIZE, fontWeight: 600 }}
            >
              {group.score === null
                ? UNKNOWN_TEXT
                : `${formatNumber(group.score, 0)} · ${group.band.label}`}
            </text>
          </g>
        ))}
        {map.cells.map((cell) => (
          <HeatCell
            key={cell.key}
            cell={cell}
            href={
              companyId ? companyVariableRoute(companyId, cell.key) : undefined
            }
          />
        ))}
      </svg>
      <VariableInfoLayer
        cells={map.cells}
        width={map.width}
        height={map.height}
      />
    </div>
  );
}
