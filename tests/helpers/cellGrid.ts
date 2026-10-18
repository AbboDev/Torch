import type { CellGrid } from "@/enemies/crawl";

/**
 * A world drawn with characters, one cell each: "#" is solid, anything else is
 * not. What is outside of the drawing is solid, as the edge of a map is.
 */
export function gridOf(rows: string[]): CellGrid {
  return {
    isSolid: (col, row) => {
      const line = rows[row];

      return line === undefined || line[col] === undefined || line[col] === "#";
    },
  };
}
