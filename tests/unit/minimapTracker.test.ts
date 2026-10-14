import { describe, expect, it } from "vitest";
import { ExploredGrid } from "@/world/explored";
import { buildMinimapMap } from "@/world/minimap";
import { revealAround } from "@/world/minimapTracker";

const map = buildMinimapMap({
  cols: 40,
  rows: 20,
  tileSize: 16,
  isFilled: () => false,
  rooms: [{ x: 0, y: 0, width: 640, height: 320 }],
  objects: [],
});

const live = (overrides = {}) => ({
  player: { x: 8 * 16 + 8, y: 6 * 16 + 8 },
  // 20 x 11 tiles, with the Player a little left of the middle
  view: { x: 0, y: 16, width: 320, height: 176 },
  isDark: false,
  torchRadius: 128,
  ...overrides,
});

describe("revealAround", () => {
  it("reveals what the screen shows in a lit room", () => {
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

    // from the middle of the tile 0 to the middle of the tile 20
    expect(grid.has(0, 0)).toBe(true);
    expect(grid.has(20, 11)).toBe(true);
    expect(grid.has(21, 5)).toBe(false);
  });

  it("reveals only what the torch lights in a dark room", () => {
    const grid = new ExploredGrid(40, 20);

    revealAround(map, grid, live({ isDark: true }));

    expect(grid.has(8, 6)).toBe(true);
    expect(grid.has(16, 6)).toBe(true);
    expect(grid.has(17, 6)).toBe(false);
    // the screen is not seen, only the light
    expect(grid.has(0, 1)).toBe(false);
    expect(grid.has(8, 14)).toBe(true);
    expect(grid.has(8, 15)).toBe(false);
  });

  it("follows the torch when it is stronger", () => {
    const weak = new ExploredGrid(40, 20);
    const strong = new ExploredGrid(40, 20);

    revealAround(map, weak, live({ isDark: true, torchRadius: 48 }));
    revealAround(map, strong, live({ isDark: true, torchRadius: 160 }));

    expect(strong.count()).toBeGreaterThan(weak.count());
  });

  it("always reveals the cell of the Player, even with no view", () => {
    const grid = new ExploredGrid(40, 20);

    revealAround(map, grid, live({ view: { x: 0, y: 0, width: 0, height: 0 } }));

    expect(grid.count()).toBe(1);
    expect(grid.has(8, 6)).toBe(true);
  });

  it("does not fail when the view is out of the map", () => {
    const grid = new ExploredGrid(40, 20);

    revealAround(map, grid, live({ view: { x: -400, y: -400, width: 320, height: 176 } }));

    expect(grid.count()).toBe(1);
  });
});
