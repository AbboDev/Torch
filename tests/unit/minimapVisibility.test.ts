import { describe, expect, it } from "vitest";
import { Darkness } from "@/world/darkness";
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

/** The same, with the screen showing 20 x 8 cells from (20, 0): the dark room */
const darkFrame = (col: number, row: number, torchRadius = 30) => ({
  ...frame(col, row, torchRadius),
  visible: { x: 200, y: 0, width: 200, height: 80 },
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

  it("is only what the torch reaches on the screen, in a dark room", () => {
    const dark = darkFrame(25, 4, 30);

    expect(isCellVisible(map, 25, 4, dark)).toBe(true);
    expect(isCellVisible(map, 28, 4, dark)).toBe(true);
    expect(isCellVisible(map, 29, 4, dark)).toBe(false);
    expect(isCellVisible(map, 23, 6, dark)).toBe(true);
    expect(isCellVisible(map, 22, 6, dark)).toBe(false);
  });

  it("does not take the screen for light in a dark room", () => {
    // the screen shows all the cells around, the torch only the near ones
    const dark = darkFrame(25, 4, 20);

    expect(isCellVisible(map, 20, 0, dark)).toBe(false);
    expect(isCellVisible(map, 25, 4, dark)).toBe(true);
  });

  it("does not take the torch for light where the screen does not show", () => {
    // the Player is near the border of the dark room: the torch reaches the
    // cells next to it, but the screen shows only the lit room
    const lit = {
      player: { x: 205, y: 45 },
      visible: { x: 0, y: 0, width: 200, height: 90 },
      torchRadius: 50,
    };

    expect(isCellVisible(map, 22, 4, lit)).toBe(false);
    // and the lit room is seen, as the screen shows it
    expect(isCellVisible(map, 19, 4, lit)).toBe(true);
  });

  it("follows the torch when it is stronger", () => {
    expect(isCellVisible(map, 31, 4, darkFrame(25, 4, 30))).toBe(false);
    expect(isCellVisible(map, 31, 4, darkFrame(25, 4, 70))).toBe(true);
  });

  it("is never true outside the rooms", () => {
    expect(isCellVisible(map, 5, 9, frame(5, 8))).toBe(false);
    expect(isCellVisible(map, -3, 0, frame(0, 0))).toBe(false);
  });
});

describe("getCandidateCells", () => {
  it("is the box of the screen, cut at the map: only what it shows can be seen", () => {
    expect(getCandidateCells(map, frame(25, 4, 30))).toEqual({
      col0: 0,
      row0: 0,
      col1: 10,
      row1: 6,
    });
    expect(
      getCandidateCells(map, {
        ...frame(0, 0),
        visible: { x: -50, y: -50, width: 100, height: 100 },
      })
    ).toEqual({ col0: 0, row0: 0, col1: 5, row1: 5 });
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

  it("shows an enemy in a dark room only inside the torch light, on the screen", () => {
    const dark = darkFrame(25, 4, 30);

    expect(isEnemyVisible(map, seen(), at(27, 4), dark)).toBe(true);
    expect(isEnemyVisible(map, seen(), at(35, 4), dark)).toBe(false);
    expect(isEnemyVisible(map, seen(), at(35, 4), darkFrame(32, 4, 30))).toBe(true);
    // in the light of the torch, but out of the screen
    expect(
      isEnemyVisible(map, seen(), at(23, 4), {
        ...dark,
        visible: { x: 250, y: 0, width: 100, height: 80 },
      })
    ).toBe(false);
  });

  it("does not show an enemy where the Player has not been", () => {
    const grid = new ExploredGrid(40, 10);

    expect(isEnemyVisible(map, grid, at(8, 3), frame(5, 3))).toBe(false);
  });

  it("does not show an enemy outside the rooms", () => {
    expect(isEnemyVisible(map, seen(), at(5, 9), frame(5, 3))).toBe(false);
  });
});

describe("the levels of darkness", () => {
  /** A map of 20 x 6 tiles of 10 pixels with a single room, of the level given */
  const levelMap = (darkness: string | null) =>
    buildMinimapMap({
      cols: 20,
      rows: 6,
      tileSize: 10,
      isFilled: () => false,
      rooms: [
        {
          id: 1,
          x: 0,
          y: 0,
          width: 200,
          height: 60,
          properties:
            darkness === null
              ? []
              : [
                  // the color goes with every level but "none"
                  ...(darkness === "none"
                    ? []
                    : [{ name: "dark", value: "404040" }]),
                  { name: "darkness", value: darkness },
                ],
        },
      ],
      objects: [],
    });

  /** The Player at (3, 3) with the torch reaching 2 cells, the screen showing 12 */
  const near = {
    player: { x: 35, y: 35 },
    visible: { x: 0, y: 0, width: 120, height: 60 },
    torchRadius: 20,
  };

  it("sees all the screen with the light on or in a room a little shaded", () => {
    for (const level of [null, "none", "shaded"]) {
      expect(isCellVisible(levelMap(level), 11, 0, near)).toBe(true);
    }
  });

  it("sees only the light of the torch in a dark or a corrupted room", () => {
    for (const level of ["dark", "corrupted_partial", "corrupted_total"]) {
      const map = levelMap(level);

      expect(isCellVisible(map, 4, 3, near)).toBe(true);
      expect(isCellVisible(map, 11, 0, near)).toBe(false);
    }
  });

  it("shows the enemies of the room, if the room is a little shaded", () => {
    const grid = new ExploredGrid(20, 6);
    grid.revealRect(0, 0, 20, 6);

    expect(isEnemyVisible(levelMap("shaded"), grid, { x: 105, y: 5 }, near)).toBe(
      true
    );
  });

  it("shows the enemies only in the light of the torch, if the room is corrupted", () => {
    const grid = new ExploredGrid(20, 6);
    grid.revealRect(0, 0, 20, 6);

    for (const level of ["dark", "corrupted_partial", "corrupted_total"]) {
      const map = levelMap(level);

      expect(isEnemyVisible(map, grid, { x: 45, y: 35 }, near)).toBe(true);
      expect(isEnemyVisible(map, grid, { x: 105, y: 5 }, near)).toBe(false);
    }
  });

  it("tells the darkness of the room of a cell", () => {
    expect(levelMap("corrupted_total").rooms[0].darkness).toBe(
      Darkness.CORRUPTED_TOTAL
    );
  });
});
