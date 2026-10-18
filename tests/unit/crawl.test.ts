import { describe, expect, it } from "vitest";
import {
  CellGrid,
  Crawl,
  DOWN,
  LEFT,
  RIGHT,
  Step,
  UP,
  arePerpendicular,
  attach,
  getDefaultHeading,
  getWaypoints,
  negate,
} from "@/enemies/crawl";
import { gridOf } from "../helpers/cellGrid";

const at = (
  col: number,
  row: number,
  surface: Step,
  heading: Step
): Crawl => ({ col, row, surface, heading });

/** Where the enemy is after `steps` of moving, one waypoint at a time */
function walk(start: Crawl, grid: CellGrid, steps: number): Crawl[] {
  const visited: Crawl[] = [];
  let state = start;

  while (visited.length < steps) {
    const waypoints = getWaypoints(state, grid);

    if (waypoints.length === 0) {
      break;
    }

    for (const waypoint of waypoints) {
      visited.push(waypoint);
      state = waypoint;
    }
  }

  return visited;
}

describe("steps", () => {
  it("has a way opposite to every way, with no negative zero", () => {
    expect(negate(LEFT)).toEqual(RIGHT);
    expect(negate(UP)).toEqual(DOWN);
    expect(Object.is(negate(LEFT).y, 0)).toBe(true);
  });

  it("knows the ways along a surface from the ways towards it", () => {
    expect(arePerpendicular(DOWN, LEFT)).toBe(true);
    expect(arePerpendicular(DOWN, UP)).toBe(false);
    expect(arePerpendicular(LEFT, LEFT)).toBe(false);
  });

  it("goes left on a floor or a ceiling and up on a wall, if nothing is said", () => {
    expect(getDefaultHeading(DOWN)).toEqual(LEFT);
    expect(getDefaultHeading(UP)).toEqual(LEFT);
    expect(getDefaultHeading(LEFT)).toEqual(UP);
    expect(getDefaultHeading(RIGHT)).toEqual(UP);
  });
});

describe("attach", () => {
  it("clings to the surface wanted when it is there", () => {
    const grid = gridOf(["###", "#.#", "###"]);

    expect(attach({ col: 1, row: 1 }, grid, { surface: UP, heading: RIGHT })).toEqual(
      at(1, 1, UP, RIGHT)
    );
  });

  it("clings to another surface when the one wanted is not there", () => {
    // only a wall at the left of the cell
    const open: CellGrid = {
      isSolid: (col, row) => col === 0 && row === 1,
    };

    expect(attach({ col: 1, row: 1 }, open, { surface: DOWN })).toEqual(
      at(1, 1, LEFT, UP)
    );
  });

  it("goes by the order floor, left, right, ceiling when none is wanted", () => {
    const room = gridOf(["###", "#.#", "###"]);

    expect(attach({ col: 1, row: 1 }, room)?.surface).toEqual(DOWN);
  });

  it("takes a way along the new surface if the one wanted is not", () => {
    const room = gridOf(["###", "#.#", "###"]);

    // the wanted way is down, which is not along a floor
    expect(attach({ col: 1, row: 1 }, room, { surface: DOWN, heading: DOWN })?.heading).toEqual(
      LEFT
    );
  });

  it("is nothing when there is nothing to cling to: the enemy falls", () => {
    const open: CellGrid = { isSolid: () => false };

    expect(attach({ col: 5, row: 5 }, open)).toBeNull();
  });
});

describe("getWaypoints: on the floor", () => {
  it("walks on to the next cell", () => {
    const grid = gridOf([
      "#.....#",
      "#.....#",
      "#######",
    ]);

    // the row 1 is air, the row 2 is the floor; the enemy is at (3, 1)
    expect(getWaypoints(at(3, 1, DOWN, RIGHT), grid)).toEqual([
      at(4, 1, DOWN, RIGHT),
    ]);
  });

  it("turns up the wall at a wall in the way (an inner corner)", () => {
    const grid = gridOf([
      "#....#",
      "#....#",
      "#....#",
      "######",
    ]);

    // on the floor, going right, at the last free cell: the wall is the new surface
    const [first] = getWaypoints(at(4, 2, DOWN, RIGHT), grid);

    expect(first).toEqual(at(4, 1, RIGHT, UP));
  });

  it("goes round the end of a surface (an outer corner)", () => {
    const grid = gridOf([
      "......",
      "......",
      "###...",
      "###...",
    ]);

    // on the top of a block, going right, at its last cell
    const waypoints = getWaypoints(at(2, 1, DOWN, RIGHT), grid);

    expect(waypoints).toEqual([
      // past the edge, still as it was
      at(3, 1, DOWN, RIGHT),
      // down beside the edge: the block is now at its left, and it goes down
      at(3, 2, LEFT, DOWN),
    ]);
  });
});

describe("getWaypoints: boxed in", () => {
  it("does not move when the four sides are solid", () => {
    const grid = gridOf(["###", "#.#", "###"]);

    expect(getWaypoints(at(1, 1, DOWN, RIGHT), grid)).toEqual([]);
  });
});

describe("walking round a whole shape", () => {
  it("goes round a block of one cell, and comes back where it started", () => {
    // the edge of the map is solid: the frame of one cell
    const framed = gridOf([
      "#######",
      "#.....#",
      "#.....#",
      "#..#..#",
      "#.....#",
      "#.....#",
      "#######",
    ]);

    // on the top of the block, going right
    const start = at(3, 2, DOWN, RIGHT);
    const path = walk(start, framed, 8);

    // round the block: top, right side, bottom, left side, in 8 moves
    expect(path.map((p) => [p.col, p.row])).toEqual([
      [4, 2],
      [4, 3], // the right side, going down
      [4, 4],
      [3, 4], // below, going left
      [2, 4],
      [2, 3], // the left side, going up
      [2, 2],
      [3, 2], // back above
    ]);
    expect(path[7]).toEqual(start);
  });

  it("goes round the inside of a room, along the floor, the wall, the ceiling and the other wall", () => {
    const room = gridOf([
      "#####",
      "#...#",
      "#...#",
      "#...#",
      "#####",
    ]);

    // on the floor at the left, going right
    const path = walk(at(1, 3, DOWN, RIGHT), room, 8);

    expect(path.map((p) => [p.col, p.row, p.surface, p.heading])).toEqual([
      [2, 3, DOWN, RIGHT],
      [3, 3, DOWN, RIGHT],
      [3, 2, RIGHT, UP], // up the right wall
      [3, 1, RIGHT, UP],
      [2, 1, UP, LEFT], // along the ceiling
      [1, 1, UP, LEFT],
      [1, 2, LEFT, DOWN], // down the left wall
      [1, 3, LEFT, DOWN],
    ]);
  });

  it("goes round and round: after a whole turn it is where it was, as it was", () => {
    const room = gridOf([
      "#####",
      "#...#",
      "#...#",
      "#...#",
      "#####",
    ]);

    // 8 cells to go round the 3 x 3 room, twice
    const path = walk(at(1, 3, DOWN, RIGHT), room, 16);

    expect(path).toHaveLength(16);
    for (let i = 0; i < 8; i++) {
      expect(path[i + 8]).toEqual(path[i]);
    }
  });

  it("goes round a ledge: along the top, down the end, under it and up the other end", () => {
    // a block of 2 cells in the middle of a room
    const grid = gridOf([
      "#######",
      "#.....#",
      "#.....#",
      "#.##..#",
      "#.....#",
      "#######",
    ]);
    const path = walk(at(2, 2, DOWN, RIGHT), grid, 6);

    expect(path.map((p) => [p.col, p.row])).toEqual([
      [3, 2],
      [4, 2],
      [4, 3], // beside the right end, going down
      [4, 4],
      [3, 4], // under the block, going left
      [2, 4],
    ]);
  });
});

describe("walking on a ceiling", () => {
  it("goes along a ceiling and turns down a wall at the end", () => {
    const grid = gridOf([
      "######",
      "#....#",
      "#....#",
      "######",
    ]);
    const path = walk(at(1, 1, UP, RIGHT), grid, 4);

    expect(path.map((p) => [p.col, p.row, p.surface])).toEqual([
      [2, 1, UP],
      [3, 1, UP],
      [4, 1, UP],
      [4, 2, RIGHT],
    ]);
    // going down the right wall
    expect(path[3].heading).toEqual(DOWN);
  });
});
