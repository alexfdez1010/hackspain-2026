/** Axis-aligned box in viewBox units. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How a column treemap is turned into rows. */
export interface StackOptions {
  /** Height reserved above every row for its heading, in viewBox units. */
  header: number;
  /** Factor applied to the column widths when they become row heights. */
  scale: number;
}

/** A treemap laid out as rows, in viewBox units. */
export interface StackedLayout<G extends Box, C extends Box> {
  groups: G[];
  cells: C[];
  width: number;
  height: number;
}

/** Heading strip and vertical squeeze shared by the two stacked treemaps. */
export const STACK_OPTIONS: StackOptions = { header: 28, scale: 0.45 };

/**
 * Turns a column treemap into rows, so it fits a screen narrower than the
 * columns need.
 *
 * Every column becomes a row: its width becomes the height of the row, scaled
 * by `scale`, and its cells spread across the full width in the order they
 * had from top to bottom. Each box is scaled by the same factor, so the areas
 * keep the proportion the column layout gave them. A strip of `header` units
 * is left above every row for its heading.
 *
 * @param layout - Column layout to transform.
 * @param cellsOf - Reads the cells of a group.
 * @param withCells - Writes the transformed cells back into a group.
 * @param options - Heading strip and vertical squeeze.
 * @returns The rows, their cells and the size of the new drawing.
 */
export function stackColumns<G extends Box, C extends Box>(
  layout: { groups: readonly G[]; width: number; height: number },
  cellsOf: (group: G) => readonly C[],
  withCells: (group: G, cells: C[]) => G,
  { header, scale }: StackOptions = STACK_OPTIONS,
): StackedLayout<G, C> {
  const groups = layout.groups.map((group, index) => {
    const top = group.x * scale + (index + 1) * header;
    const cells = cellsOf(group).map((cell) => ({
      ...cell,
      x: cell.y,
      y: top + (cell.x - group.x) * scale,
      width: cell.height,
      height: cell.width * scale,
    }));
    return withCells(
      {
        ...group,
        x: 0,
        y: top,
        width: layout.height,
        height: group.width * scale,
      },
      cells,
    );
  });
  return {
    groups,
    cells: groups.flatMap((group) => cellsOf(group)),
    width: layout.height,
    height: layout.width * scale + layout.groups.length * header,
  };
}
