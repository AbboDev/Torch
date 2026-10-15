import { describe, expect, it } from "vitest";
import { ExploredGrid } from "@/world/explored";
import { buildMinimapMap } from "@/world/minimap";
import { revealAround } from "@/world/minimapTracker";

/**
 * A map of 40 x 20 tiles of 16 pixels with a room which is not dark (the
 * columns 0 to 24) and a dark one (the columns 25 to 39)
 */
const map = buildMinimapMap({
  cols: 40,
  rows: 20,
  tileSize: 16,
  isFilled: () => false,
  rooms: [
    { id: 1, x: 0, y: 0, width: 400, height: 320 },
    {
      id: 2,
      x: 400,
      y: 0,
      width: 240,
      height: 320,
      properties: [{ name: "dark", value: "000000" }],
    },
  ],
  objects: [],
});

const live = (overrides = {}) => ({
  player: { x: 8 * 16 + 8, y: 6 * 16 + 8 },
  // 20 x 11 tiles
  view: { x: 0, y: 16, width: 320, height: 176 },
  torchRadius: 128,
  ...overrides,
});

describe("revealAround: a room which is not dark", () => {
  it("reveals what the screen shows", () => {
    const grid = new ExploredGrid(40, 20);

    revealAround(map, grid, live());

    expect(grid.count()).toBe(20 * 11);
    expect(grid.has(0, 1)).toBe(true);
    expect(grid.has(19, 11)).toBe(true);
    expect(grid.has(20, 5)).toBe(false);
    expect(grid.has(5, 12)).toBe(false);
    expect(grid.has(5, 0)).toBe(false);
  });

  it("reveals what the camera shows even when it is not on whole tiles", () => {
    const grid = new ExploredGrid(40, 20);

    revealAround(map, grid, live({ view: { x: 8, y: 8, width: 320, height: 176 } }));

    expect(grid.has(0, 0)).toBe(true);
    expect(grid.has(20, 11)).toBe(true);
    expect(grid.has(21, 5)).toBe(false);
  });

  it("does not follow the torch: the whole screen is lit", () => {
    const weak = new ExploredGrid(40, 20);
    const strong = new ExploredGrid(40, 20);

    revealAround(map, weak, live({ torchRadius: 16 }));
    revealAround(map, strong, live({ torchRadius: 200 }));

    expect(weak.count()).toBe(strong.count());
  });
});

describe("revealAround: a dark room", () => {
  const dark = (overrides = {}) =>
    live({
      player: { x: 30 * 16 + 8, y: 6 * 16 + 8 },
      view: { x: 320, y: 16, width: 320, height: 176 },
      ...overrides,
    });

  it("reveals only what the torch lights, not what the screen shows", () => {
    const grid = new ExploredGrid(40, 20);

    revealAround(map, grid, dark());

    expect(grid.has(30, 6)).toBe(true);
    expect(grid.has(38, 6)).toBe(true);
    expect(grid.has(39, 6)).toBe(false);
    // the screen shows these, but the light does not reach them
    expect(grid.has(25, 14)).toBe(false);
    expect(grid.has(35, 14)).toBe(false);
    expect(grid.has(30, 14)).toBe(true);
    expect(grid.has(30, 15)).toBe(false);
  });

  it("follows the torch when it is stronger", () => {
    const weak = new ExploredGrid(40, 20);
    const strong = new ExploredGrid(40, 20);

    revealAround(map, weak, dark({ torchRadius: 48 }));
    revealAround(map, strong, dark({ torchRadius: 160 }));

    expect(strong.count()).toBeGreaterThan(weak.count());
  });

  it("does not reveal the dark room from the room which is not dark", () => {
    const grid = new ExploredGrid(40, 20);

    // the screen goes over the border of the rooms, with the torch off
    revealAround(
      map,
      grid,
      live({
        player: { x: 20 * 16, y: 6 * 16 },
        view: { x: 240, y: 16, width: 320, height: 176 },
        torchRadius: 0,
      })
    );

    expect(grid.has(24, 6)).toBe(true);
    expect(grid.has(26, 6)).toBe(false);
    expect(grid.has(33, 6)).toBe(false);
  });

  it("lets the screen decide in the room which is not dark, not the torch", () => {
    const grid = new ExploredGrid(40, 20);

    // at the border, in the dark room: the torch reaches the other room too, but
    // there the screen decides, and the screen shows only the dark room
    revealAround(
      map,
      grid,
      live({
        player: { x: 26 * 16 + 8, y: 6 * 16 + 8 },
        view: { x: 400, y: 16, width: 240, height: 176 },
      })
    );

    expect(grid.has(24, 6)).toBe(false);
    expect(grid.has(26, 6)).toBe(true);
  });
});

describe("revealAround: always", () => {
  it("reveals the cell of the Player, even with no view", () => {
    const grid = new ExploredGrid(40, 20);

    revealAround(map, grid, live({ view: { x: 0, y: 0, width: 0, height: 0 } }));

    expect(grid.has(8, 6)).toBe(true);
    expect(grid.count()).toBeGreaterThan(0);
  });

  it("does not fail when the view is out of the map", () => {
    const grid = new ExploredGrid(40, 20);

    revealAround(map, grid, live({ view: { x: -400, y: -400, width: 320, height: 176 } }));

    expect(grid.has(8, 6)).toBe(true);
  });

  it("does not reveal what is outside the rooms", () => {
    const outside = buildMinimapMap({
      cols: 40,
      rows: 20,
      tileSize: 16,
      isFilled: () => false,
      rooms: [{ x: 0, y: 0, width: 160, height: 160 }],
      objects: [],
    });
    const grid = new ExploredGrid(40, 20);

    revealAround(outside, grid, live());

    expect(grid.has(5, 5)).toBe(true);
    expect(grid.has(12, 5)).toBe(false);
  });
});
