import { describe, expect, it } from "vitest";
import mapSource from "../../assets/maps/chozodia.json?raw";
import { CellGrid, Crawl, arePerpendicular, attach, getWaypoints } from "@/enemies/crawl";

// A crawler let loose on the real map: whatever the map is, it must stay in
// the free cells, cling to something and not stop in the middle of a corridor
const map = JSON.parse(mapSource);

const layers: Array<{ name: string; data: number[] }> = map.layers.filter(
  (layer: { type: string }) => layer.type === "tilelayer"
);
const solidLayers = layers.filter(
  (layer) => layer.name === "collision" || layer.name === "breakables"
);

const grid: CellGrid = {
  isSolid: (col, row) =>
    col < 0 ||
    row < 0 ||
    col >= map.width ||
    row >= map.height ||
    solidLayers.some((layer) => layer.data[row * map.width + col] !== 0),
};

/** The free cells which have something to cling to, one in a few */
function startCells(every: number) {
  const cells: Array<{ col: number; row: number }> = [];
  let count = 0;

  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      if (!grid.isSolid(col, row) && attach({ col, row }, grid) && count++ % every === 0) {
        cells.push({ col, row });
      }
    }
  }

  return cells;
}

describe("a crawler on the map chozodia", () => {
  it("has cells to start from", () => {
    expect(startCells(1).length).toBeGreaterThan(100);
  });

  it("stays out of the walls, clings to something and does not stop, from anywhere", () => {
    for (const cell of startCells(7)) {
      let state = attach(cell, grid) as Crawl;
      const where = `from (${cell.col}, ${cell.row})`;

      for (let steps = 0; steps < 300; steps++) {
        const waypoints = getWaypoints(state, grid);

        // boxed in only when all four sides are solid: not in the middle of a corridor
        const open = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(
          ([x, y]) => !grid.isSolid(state.col + x, state.row + y)
        );
        if (!open) {
          break;
        }
        expect(waypoints.length, `stuck ${where} at step ${steps}`).toBeGreaterThan(0);

        for (const waypoint of waypoints) {
          expect(grid.isSolid(waypoint.col, waypoint.row), `in a wall ${where}`).toBe(false);
          expect(arePerpendicular(waypoint.surface, waypoint.heading)).toBe(true);
        }

        // where a step ends it clings to something
        state = waypoints[waypoints.length - 1];
        expect(
          grid.isSolid(state.col + state.surface.x, state.row + state.surface.y),
          `nothing to cling to ${where} at step ${steps}`
        ).toBe(true);
      }
    }
  });
});
