import { describe, expect, it } from "vitest";
import { CellGrid, DOWN, LEFT, RIGHT, UP } from "@/enemies/crawl";
import { CrawlMotion } from "@/enemies/CrawlMotion";
import { gridOf } from "../helpers/cellGrid";

const room = gridOf([
  "#####",
  "#...#",
  "#...#",
  "#...#",
  "#####",
]);

/** The position in cells, rounded so that the sums of floats do not matter */
const where = (motion: CrawlMotion) => ({
  x: Math.round(motion.position.x * 1000) / 1000,
  y: Math.round(motion.position.y * 1000) / 1000,
});

describe("CrawlMotion: where it starts", () => {
  it("is in the middle of its cell, clinging to the surface wanted", () => {
    const motion = new CrawlMotion({ col: 1, row: 3 }, room, {
      surface: DOWN,
      heading: RIGHT,
    });

    expect(where(motion)).toEqual({ x: 1.5, y: 3.5 });
    expect(motion.surface).toEqual(DOWN);
    expect(motion.heading).toEqual(RIGHT);
    expect(motion.falling).toBe(false);
  });

  it("clings to what there is when the surface wanted is not there", () => {
    const motion = new CrawlMotion({ col: 1, row: 1 }, room, { surface: DOWN });

    // the cell (1, 1) has the ceiling above and the wall at its left
    expect(motion.surface).toEqual(LEFT);
  });

  it("falls when there is nothing to cling to", () => {
    const open: CellGrid = { isSolid: (_col, row) => row >= 10 };
    const motion = new CrawlMotion({ col: 2, row: 2 }, open);

    expect(motion.falling).toBe(true);
  });
});

describe("CrawlMotion: advancing", () => {
  it("moves along the surface at the speed given, between two cells", () => {
    const motion = new CrawlMotion({ col: 1, row: 3 }, room, {
      surface: DOWN,
      heading: RIGHT,
    });

    motion.advance(0.25);
    expect(where(motion)).toEqual({ x: 1.75, y: 3.5 });

    motion.advance(0.25);
    expect(where(motion)).toEqual({ x: 2, y: 3.5 });
  });

  it("does not depend on how the time is cut in frames", () => {
    const one = new CrawlMotion({ col: 1, row: 3 }, room, {
      surface: DOWN,
      heading: RIGHT,
    });
    const many = new CrawlMotion({ col: 1, row: 3 }, room, {
      surface: DOWN,
      heading: RIGHT,
    });

    one.advance(5);
    for (let i = 0; i < 50; i++) {
      many.advance(0.1);
    }

    expect(where(many)).toEqual(where(one));
    expect(many.surface).toEqual(one.surface);
    expect(many.heading).toEqual(one.heading);
  });

  it("turns at the start of a move, not at the end: it goes up the wall already turned", () => {
    const motion = new CrawlMotion({ col: 1, row: 3 }, room, {
      surface: DOWN,
      heading: RIGHT,
    });

    motion.advance(2.1);

    // a tenth of a cell up from the corner, as it should be
    expect(motion.surface).toEqual(RIGHT);
    expect(motion.heading).toEqual(UP);
  });

  it("turns up the wall at the corner, with the speed which was left", () => {
    const motion = new CrawlMotion({ col: 1, row: 3 }, room, {
      surface: DOWN,
      heading: RIGHT,
    });

    // two cells along the floor to the corner, then half a cell up the wall
    motion.advance(2.5);

    // halfway up from the cell (3, 3) to the cell (3, 2)
    expect(where(motion)).toEqual({ x: 3.5, y: 3 });
    expect(motion.surface).toEqual({ x: 1, y: 0 });
    expect(motion.heading).toEqual(UP);
  });

  it("goes round a whole room: floor, right wall, ceiling, left wall, and again", () => {
    const motion = new CrawlMotion({ col: 1, row: 3 }, room, {
      surface: DOWN,
      heading: RIGHT,
    });

    motion.advance(8);

    // the 8 cells of the room, and it is again where it started (at the end of its way down)
    expect(where(motion)).toEqual({ x: 1.5, y: 3.5 });

    motion.advance(8);
    expect(where(motion)).toEqual({ x: 1.5, y: 3.5 });
  });

  it("goes round the end of a surface, past the edge and down beside it", () => {
    const ledge = gridOf([
      "#######",
      "#.....#",
      "#.....#",
      "#.##..#",
      "#.....#",
      "#######",
    ]);
    const motion = new CrawlMotion({ col: 3, row: 2 }, ledge, {
      surface: DOWN,
      heading: RIGHT,
    });

    // one cell to the right, past the edge of the top of the block: still on the top
    motion.advance(1);
    expect(where(motion)).toEqual({ x: 4.5, y: 2.5 });
    expect(motion.surface).toEqual(DOWN);

    // and down beside the end of the block, which is now at its left
    motion.advance(1);
    expect(where(motion)).toEqual({ x: 4.5, y: 3.5 });
    expect(motion.surface).toEqual(LEFT);
    expect(motion.heading).toEqual(DOWN);
  });

  it("stays when it is boxed in", () => {
    const box = gridOf(["###", "#.#", "###"]);
    const motion = new CrawlMotion({ col: 1, row: 1 }, box, {
      surface: DOWN,
      heading: RIGHT,
    });

    motion.advance(10);

    expect(where(motion)).toEqual({ x: 1.5, y: 1.5 });
  });

  it("does nothing for no distance", () => {
    const motion = new CrawlMotion({ col: 1, row: 3 }, room, {
      surface: DOWN,
      heading: RIGHT,
    });

    motion.advance(0);

    expect(where(motion)).toEqual({ x: 1.5, y: 3.5 });
  });
});

describe("CrawlMotion: falling", () => {
  /** A world whose floor and blocks can be taken away */
  function breakable() {
    const solid = new Set(["2,5", "3,5", "4,5", "2,3"]);
    const grid: CellGrid = {
      isSolid: (col, row) => solid.has(`${col},${row}`) || col < 0 || col > 6,
    };

    return { solid, grid };
  }

  it("falls when what it clung to is gone, and clings to what it lands on", () => {
    const { solid, grid } = breakable();
    // on the top of the block at (2, 3), going right
    const motion = new CrawlMotion({ col: 2, row: 2 }, grid, {
      surface: DOWN,
      heading: RIGHT,
    });
    expect(motion.falling).toBe(false);

    // the block breaks
    solid.delete("2,3");
    motion.advance(0.1);

    expect(motion.falling).toBe(true);

    // it falls two cells, to the cell above the floor, at (2, 4): they cost a
    // quarter of a cell of crawling each
    motion.advance(0.4);
    expect(where(motion)).toEqual({ x: 2.5, y: 4.5 });
    expect(motion.falling).toBe(false);
    expect(motion.surface).toEqual(DOWN);
  });

  it("falls faster than it crawls", () => {
    const { solid, grid } = breakable();
    const motion = new CrawlMotion({ col: 2, row: 2 }, grid, {
      surface: DOWN,
      heading: RIGHT,
    });
    solid.delete("2,3");

    motion.advance(0.25);

    // a whole cell down for a quarter of a cell of crawling
    expect(where(motion).y).toBeCloseTo(3.5);
    expect(motion.falling).toBe(true);
  });

  it("clings to the side when it is gone from under it but there is a wall beside it", () => {
    // a wall at the right of the cell, nothing under it
    const wall: CellGrid = {
      isSolid: (col, row) => col === 3 && row >= 0 && row <= 9,
    };
    const motion = new CrawlMotion({ col: 2, row: 4 }, wall, {
      surface: DOWN,
      heading: RIGHT,
    });

    // there is no floor, so it takes the wall it has beside it, and goes up it
    expect(motion.surface).toEqual(RIGHT);
    expect(motion.falling).toBe(false);
  });
});
