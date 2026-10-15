import { describe, expect, it } from "vitest";
import { ExploredGrid } from "@/world/explored";
import { buildMinimapMap } from "@/world/minimap";
import {
  getCandidateCells,
  getRoomOf,
  getViewCells,
  isCellVisible,
  isEnemyVisible,
} from "@/world/minimapVisibility";

/**
 * A map of 40 x 10 tiles of 10 pixels: a lit room in the columns 0 to 19, a
 * dark one in the columns 20 to 39, and no room in the row 9
 */
const map = buildMinimapMap({
  cols: 40,
  rows: 10,
  tileSize: 10,
  isFilled: () => false,
  rooms: [
    { id: 1, x: 0, y: 0, width: 200, height: 90 },
    {
      id: 2,
      x: 200,
      y: 0,
      width: 200,
      height: 90,
      properties: [{ name: "dark", value: "000000" }],
    },
  ],
  objects: [],
});

/** The Player at the cell (col, row), the screen showing 10 x 6 cells from (0, 0) */
const frame = (col: number, row: number, torchRadius = 30) => ({
  player: { x: col * 10 + 5, y: row * 10 + 5 },
  visible: { x: 0, y: 0, width: 100, height: 60 },
  torchRadius,
});

describe("getViewCells", () => {
  it("is the cells the rectangle touches", () => {
    expect(getViewCells(map, { x: 5, y: 5, width: 20, height: 10 })).toEqual({
      col0: 0,
      row0: 0,
      col1: 3,
      row1: 2,
    });
  });
});

describe("getRoomOf", () => {
  it("is the room of the cell, or -1 outside of the rooms and of the map", () => {
    expect(getRoomOf(map, 5, 5)).toBe(0);
    expect(getRoomOf(map, 25, 5)).toBe(1);
    expect(getRoomOf(map, 5, 9)).toBe(-1);
    expect(getRoomOf(map, -1, 0)).toBe(-1);
    expect(getRoomOf(map, 40, 0)).toBe(-1);
  });
});

describe("isCellVisible", () => {
  it("is what the screen shows, in a room which is not dark", () => {
    expect(isCellVisible(map, 0, 0, frame(5, 3))).toBe(true);
    expect(isCellVisible(map, 9, 5, frame(5, 3))).toBe(true);
    expect(isCellVisible(map, 10, 3, frame(5, 3))).toBe(false);
    expect(isCellVisible(map, 5, 6, frame(5, 3))).toBe(false);
  });

  it("is only what the torch reaches, in a dark room", () => {
    const dark = frame(25, 4, 30);

    expect(isCellVisible(map, 25, 4, dark)).toBe(true);
    expect(isCellVisible(map, 28, 4, dark)).toBe(true);
    expect(isCellVisible(map, 29, 4, dark)).toBe(false);
    expect(isCellVisible(map, 23, 6, dark)).toBe(true);
    expect(isCellVisible(map, 22, 6, dark)).toBe(false);
  });

  it("does not take the screen for light in a dark room", () => {
    // the screen shows the cell (5, 3) but the room there is lit; show a dark room
    const screenOnDark = {
      player: { x: 255, y: 45 },
      visible: { x: 200, y: 0, width: 100, height: 60 },
      torchRadius: 20,
    };

    expect(isCellVisible(map, 20, 0, screenOnDark)).toBe(false);
    expect(isCellVisible(map, 25, 4, screenOnDark)).toBe(true);
  });

  it("follows the torch when it is stronger", () => {
    expect(isCellVisible(map, 31, 4, frame(25, 4, 30))).toBe(false);
    expect(isCellVisible(map, 31, 4, frame(25, 4, 70))).toBe(true);
  });

  it("is never true outside the rooms", () => {
    expect(isCellVisible(map, 5, 9, frame(5, 8))).toBe(false);
    expect(isCellVisible(map, -3, 0, frame(0, 0))).toBe(false);
  });
});

describe("getCandidateCells", () => {
  it("is the box around the screen and the torch, cut at the map", () => {
    expect(getCandidateCells(map, frame(25, 4, 30))).toEqual({
      col0: 0,
      row0: 0,
      col1: 29,
      row1: 8,
    });
    expect(getCandidateCells(map, frame(0, 0, 30))).toEqual({
      col0: 0,
      row0: 0,
      col1: 10,
      row1: 6,
    });
  });
});

describe("isEnemyVisible", () => {
  const seen = () => {
    const grid = new ExploredGrid(40, 10);
    grid.revealRect(0, 0, 40, 9);

    return grid;
  };
  const at = (col: number, row: number) => ({ x: col * 10 + 5, y: row * 10 + 5 });

  it("shows the enemies of the room the Player is in, if it is not dark", () => {
    expect(isEnemyVisible(map, seen(), at(18, 1), frame(5, 3))).toBe(true);
  });

  it("does not show the enemies of another room which is not dark", () => {
    const player = frame(5, 3);

    // the room of the enemy has no light of the Player: here, one in the dark room
    expect(isEnemyVisible(map, seen(), at(35, 1), player)).toBe(false);
  });

  it("shows an enemy in a dark room only inside the torch light", () => {
    const dark = frame(25, 4, 30);

    expect(isEnemyVisible(map, seen(), at(27, 4), dark)).toBe(true);
    expect(isEnemyVisible(map, seen(), at(35, 4), dark)).toBe(false);
    expect(isEnemyVisible(map, seen(), at(35, 4), frame(32, 4, 30))).toBe(true);
  });

  it("does not show an enemy where the Player has not been", () => {
    const grid = new ExploredGrid(40, 10);

    expect(isEnemyVisible(map, grid, at(8, 3), frame(5, 3))).toBe(false);
  });

  it("does not show an enemy outside the rooms", () => {
    expect(isEnemyVisible(map, seen(), at(5, 9), frame(5, 3))).toBe(false);
  });
});
