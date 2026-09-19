import { VariableInfoButton } from '@/components/charts/variable-info-button';
import { variableInfo } from '@/lib/method/variable-info';

/** One cell of a treemap, in viewBox units, with the variable it holds. */
export interface VariableInfoCell {
  key: string;
  label: string;
  weight: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VariableInfoLayerProps {
  cells: readonly VariableInfoCell[];
  /** Size of the drawing, so the cells can be placed as percentages. */
  width: number;
  height: number;
}

/**
 * Lays one info button on the top-right corner of every cell of a treemap.
 *
 * The layer is HTML positioned over the SVG in percentages of the drawing, so
 * it follows the map at any size; only the buttons take pointer events, the
 * rest of the layer lets hover and clicks reach the cells underneath.
 *
 * @param props - The cells and the size of the drawing.
 * @returns The absolutely positioned layer of buttons.
 */
export function VariableInfoLayer({
  cells,
  width,
  height,
}: VariableInfoLayerProps) {
  const percent = (value: number, total: number) => `${(value / total) * 100}%`;
  return (
    <div className="pointer-events-none absolute inset-0">
      {cells.map((cell) => {
        const info = variableInfo(cell.key, cell.label, cell.weight);
        if (!info) return null;
        return (
          <div
            key={cell.key}
            className="absolute flex justify-end"
            style={{
              left: percent(cell.x, width),
              top: percent(cell.y, height),
              width: percent(cell.width, width),
            }}
          >
            <VariableInfoButton
              info={info}
              className="pointer-events-auto m-0.5 size-6 min-w-0 rounded-full text-muted"
            />
          </div>
        );
      })}
    </div>
  );
}
