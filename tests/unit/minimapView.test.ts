import { describe, expect, it } from "vitest";
import { ExploredGrid } from "@/world/explored";
import { Hazard, buildMinimapMap } from "@/world/minimap";
import {
  ENEMY_COLOR,
  Kind,
  NONE,
  PLAYER_COLORS,
  POI_COLORS,
  Tone,
  cellCode,
  describeCell,
  getCellColor,
  getMarkers,
  getWindowOrigin,
  renderCells,
  toRuns,
} from "@/world/minimapView";

/**
 * A map of 12 x 6 tiles of 10 pixels, with a room in the columns 2 to 9 (the
 * whole height), a wall at (4, 2), water at (5, 2) and a save point at (7, 3)
 */
function setup(properties: Array<{ name: string; value: unknown }> = []) {
  const map = buildMinimapMap({
    cols: 12,
    rows: 6,
    tileSize: 10,
    isFilled: (layer, col, row) =>
      (layer === "collision" && col === 4 && row === 2) ||
      (layer === "liquids" && col === 5 && row === 2),
    rooms: [{ id: 1, x: 20, y: 0, width: 80, height: 60, properties }],
    objects: [{ id: 1, type: "save_point", x: 70, y: 30 }],
  });
  const explored = new ExploredGrid(12, 6);

  return { map, explored };
}

const window = { cols: 5, rows: 3 };

/** The Player in the cell (5, 3), with the screen showing the columns 4 to 6 */
const frame = {
  player: { x: 55, y: 35 },
  visible: { x: 40, y: 20, width: 30, height: 30 },
  torchRadius: 20,
};

const at = (cells: Uint8Array, col: number, row: number) =>
  cells[row * window.cols + col];

const { FLOOR, WALL, LIQUID, EDGE } = Kind;
const { NONE: NO_HAZARD, HOT, TOXIC } = Hazard;

describe("cellCode", () => {
  it("is never the value of a cell which is not drawn, and tells every cell apart", () => {
    const codes = new Set<number>();

    for (const hazard of [NO_HAZARD, HOT, TOXIC]) {
      for (const kind of Object.values(Kind)) {
        for (const tone of Object.values(Tone)) {
          const code = cellCode(kind, hazard, tone);

          expect(code).not.toBe(NONE);
          expect(describeCell(code)).toEqual({ kind, hazard, tone });
          codes.add(code);
        }
      }
    }

    expect(codes.size).toBe(3 * 5 * 3);
  });

  it("fits in a byte", () => {
    expect(cellCode(EDGE, TOXIC, Tone.DARK)).toBeLessThan(256);
  });
});

describe("getCellColor: the fog", () => {
  const brightness = (color: number) =>
    ((color >> 16) & 0xff) + ((color >> 8) & 0xff) + (color & 0xff);

  it("is darker for what is not seen now, and darker still in a dark room", () => {
    for (const hazard of [NO_HAZARD, HOT, TOXIC]) {
      for (const kind of Object.values(Kind)) {
        const lit = getCellColor(cellCode(kind, hazard, Tone.LIT)).color;
        const dim = getCellColor(cellCode(kind, hazard, Tone.DIM)).color;
        const dark = getCellColor(cellCode(kind, hazard, Tone.DARK)).color;

        expect(brightness(lit)).toBeGreaterThan(brightness(dim));
        expect(brightness(dim)).toBeGreaterThan(brightness(dark));
      }
    }
  });

  it("is solid where the Player sees, and a little clear in the fog", () => {
    expect(getCellColor(cellCode(FLOOR, NO_HAZARD, Tone.LIT)).alpha).toBe(1);
    expect(getCellColor(cellCode(FLOOR, NO_HAZARD, Tone.DIM)).alpha).toBeLessThan(1);
  });
});

describe("getCellColor: the rooms with a flag", () => {
  it("has its own colors for hot, toxic and the others", () => {
    const colors = [NO_HAZARD, HOT, TOXIC].map(
      (hazard) => getCellColor(cellCode(FLOOR, hazard, Tone.LIT)).color
    );

    expect(new Set(colors).size).toBe(3);
  });

  it("makes hot reddish and toxic greenish", () => {
    const hot = getCellColor(cellCode(FLOOR, HOT, Tone.LIT)).color;
    const toxic = getCellColor(cellCode(FLOOR, TOXIC, Tone.LIT)).color;
    const red = (c: number) => (c >> 16) & 0xff;
    const green = (c: number) => (c >> 8) & 0xff;
    const blue = (c: number) => c & 0xff;

    expect(red(hot)).toBeGreaterThan(green(hot));
    expect(red(hot)).toBeGreaterThan(blue(hot));
    expect(green(toxic)).toBeGreaterThan(red(toxic));
    expect(green(toxic)).toBeGreaterThan(blue(toxic));
  });

  it("keeps the same difference between the tones in every room", () => {
    for (const hazard of [HOT, TOXIC]) {
      const lit = getCellColor(cellCode(WALL, hazard, Tone.LIT)).color;
      const dark = getCellColor(cellCode(WALL, hazard, Tone.DARK)).color;

      expect(dark).not.toBe(lit);
    }
  });
});

describe("getWindowOrigin", () => {
  it("puts the Player in the middle cell of the window", () => {
    const { map } = setup();

    expect(getWindowOrigin(map, frame.player, window)).toEqual({
      left: 3,
      top: 2,
    });
  });
});

describe("renderCells", () => {
  it("draws nothing which has not been seen", () => {
    const { map, explored } = setup();

    expect(renderCells(map, explored, frame, window).every((c) => c === NONE)).toBe(
      true
    );
  });

  it("draws what is seen now in the light, and what was seen in the fog", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);

    const cells = renderCells(map, explored, frame, window);

    // the window starts at (3, 2): the column 3 is not in the screen, the 4 to 6 are
    expect(describeCell(at(cells, 0, 1)).tone).toBe(Tone.DIM);
    expect(describeCell(at(cells, 1, 1)).tone).toBe(Tone.LIT);
    expect(describeCell(at(cells, 3, 1)).tone).toBe(Tone.LIT);
    expect(describeCell(at(cells, 4, 1)).tone).toBe(Tone.DIM);
    expect(at(cells, 2, 2)).toBe(cellCode(FLOOR, NO_HAZARD, Tone.LIT));
  });

  it("draws the walls, the water and the borders of the rooms", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);

    const cells = renderCells(map, explored, frame, window);

    expect(at(cells, 1, 0)).toBe(cellCode(WALL, NO_HAZARD, Tone.LIT));
    expect(at(cells, 2, 0)).toBe(cellCode(LIQUID, NO_HAZARD, Tone.LIT));

    // the border of the room is at the row 5: the window goes down to see it
    const low = renderCells(
      map,
      explored,
      { ...frame, player: { x: 55, y: 45 } },
      window
    );
    expect(at(low, 2, 2)).toBe(cellCode(EDGE, NO_HAZARD, Tone.DIM));
  });

  it("does not draw outside the rooms, or outside the map", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);
    const nothing = { x: 0, y: 0, width: 0, height: 0 };

    // the window is at the left of the room: the columns 0 and 1 are not in it
    const left = renderCells(
      map,
      explored,
      { ...frame, player: { x: 25, y: 35 }, visible: nothing },
      window
    );

    expect(at(left, 0, 1)).toBe(NONE);
    expect(at(left, 1, 1)).toBe(NONE);
    expect(at(left, 2, 1)).not.toBe(NONE);

    // the window at the top left of the map: before the column 0 is out
    const corner = renderCells(
      map,
      explored,
      { ...frame, player: { x: 5, y: 5 }, visible: nothing },
      window
    );
    expect(at(corner, 0, 0)).toBe(NONE);
  });

  it("draws everything in the fog when the screen shows nothing of it", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);

    const cells = renderCells(
      map,
      explored,
      { ...frame, visible: { x: 1000, y: 1000, width: 30, height: 30 } },
      window
    );

    const tones = [...cells].filter((c) => c !== NONE).map((c) => describeCell(c).tone);

    expect(tones.length).toBeGreaterThan(0);
    expect(tones.every((tone) => tone === Tone.DIM)).toBe(true);
  });
});

describe("renderCells: the flags of the room", () => {
  it("colors the room which is hot or toxic", () => {
    for (const [flag, hazard] of [["hot", HOT], ["toxic", TOXIC]] as const) {
      const { map, explored } = setup([{ name: flag, value: true }]);
      explored.revealRect(0, 0, 12, 6);

      const cells = renderCells(map, explored, frame, window);

      expect(at(cells, 2, 1)).toBe(cellCode(FLOOR, hazard, Tone.LIT));
      expect(at(cells, 1, 0)).toBe(cellCode(WALL, hazard, Tone.LIT));
    }
  });

  it("shows only what the torch reaches in a dark room, even if the screen shows more", () => {
    const { map, explored } = setup([{ name: "dark", value: "000000" }]);
    explored.revealRect(0, 0, 12, 6);

    // the screen shows the columns 4 to 6, the torch reaches 2 cells around (5, 3)
    const cells = renderCells(map, explored, frame, window);

    expect(describeCell(at(cells, 2, 1)).tone).toBe(Tone.LIT);
    expect(describeCell(at(cells, 1, 1)).tone).toBe(Tone.LIT);
    // (3, 2) and (7, 2) are a little farther than the light: dark fog, not the
    // dim of the other rooms
    expect(describeCell(at(cells, 0, 0)).tone).toBe(Tone.DARK);
    expect(describeCell(at(cells, 4, 0)).tone).toBe(Tone.DARK);
    // and (4, 2), a wall in the screen and in the light, is lit
    expect(describeCell(at(cells, 1, 0)).tone).toBe(Tone.LIT);
  });

  it("has the dark fog also in a dark room which is hot or toxic", () => {
    const { map, explored } = setup([
      { name: "dark", value: "000000" },
      { name: "toxic", value: true },
    ]);
    explored.revealRect(0, 0, 12, 6);

    const cells = renderCells(map, explored, frame, window);

    expect(at(cells, 2, 1)).toBe(cellCode(FLOOR, TOXIC, Tone.LIT));
    expect(at(cells, 0, 0)).toBe(cellCode(FLOOR, TOXIC, Tone.DARK));
  });
});

describe("getMarkers", () => {
  it("has the Player in the middle of the window, in one of two colors", () => {
    const { map, explored } = setup();

    const first = getMarkers(map, explored, frame, window, false);
    const second = getMarkers(map, explored, frame, window, true);

    expect(first).toEqual([
      { col: 2, row: 1, color: PLAYER_COLORS[0], kind: "player" },
    ]);
    expect(second[0].color).toBe(PLAYER_COLORS[1]);
  });

  it("shows a point of interest only after its cell has been seen", () => {
    const { map, explored } = setup();

    expect(getMarkers(map, explored, frame, window, false)).toHaveLength(1);

    explored.reveal(7, 3);
    // the window shows the columns 3 to 7 and the rows 2 to 4
    const markers = getMarkers(map, explored, frame, window, false);

    expect(markers).toHaveLength(2);
    expect(markers[0]).toEqual({
      col: 4,
      row: 1,
      color: POI_COLORS.save,
      kind: "save",
    });
    // the Player stays the last, over the others
    expect(markers[1].kind).toBe("player");
  });

  it("leaves out the points of interest out of the window", () => {
    const { map, explored } = setup();
    explored.reveal(7, 3);

    const markers = getMarkers(
      map,
      explored,
      { ...frame, player: { x: 25, y: 35 } },
      window,
      false
    );

    expect(markers.map((marker) => marker.kind)).toEqual(["player"]);
  });
});

describe("getMarkers: the enemies", () => {
  const at = (col: number, row: number) => ({ x: col * 10 + 5, y: row * 10 + 5 });
  /** The markers of the enemies and the Player: the map has a save point too */
  const mine = <T extends { kind: string }>(markers: T[]) =>
    markers.filter((marker) => marker.kind !== "save");
  const kinds = (markers: Array<{ kind: string }>) =>
    mine(markers).map((m) => m.kind);

  it("shows the enemies of the room the Player is in, where it has been", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);

    // the window shows the columns 3 to 7 and the rows 2 to 4
    const markers = mine(
      getMarkers(map, explored, frame, window, false, [at(7, 4)])
    );

    expect(markers[0]).toEqual({
      col: 4,
      row: 2,
      color: ENEMY_COLOR,
      kind: "enemy",
    });
    // the Player stays the last, over the others
    expect(kinds(markers)).toEqual(["enemy", "player"]);
  });

  it("does not show an enemy in a cell which has not been seen", () => {
    const { map, explored } = setup();

    expect(kinds(getMarkers(map, explored, frame, window, false, [at(7, 4)]))).toEqual([
      "player",
    ]);
  });

  it("does not show an enemy out of the window or out of the rooms", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);

    const markers = getMarkers(map, explored, frame, window, false, [
      at(9, 1),
      at(0, 3),
    ]);

    expect(kinds(markers)).toEqual(["player"]);
  });

  it("shows an enemy in a dark room only inside the light of the torch", () => {
    const { map, explored } = setup([{ name: "dark", value: "000000" }]);
    explored.revealRect(0, 0, 12, 6);

    // the screen shows all the room; the torch reaches 2 cells around (5, 3):
    // (7, 3) is in the light, (7, 2) and (8, 3) are not
    const wide = { ...frame, visible: { x: 0, y: 0, width: 120, height: 60 } };
    const markers = getMarkers(map, explored, wide, window, false, [
      at(7, 3),
      at(7, 2),
    ]);

    expect(kinds(markers)).toEqual(["enemy", "player"]);
    expect(mine(markers)[0]).toMatchObject({ col: 4, row: 1 });

    // in the light, but the screen does not show it
    const narrow = { ...frame, visible: { x: 40, y: 20, width: 20, height: 30 } };

    expect(kinds(getMarkers(map, explored, narrow, window, false, [at(7, 3)]))).toEqual([
      "player",
    ]);
  });
});

describe("toRuns", () => {
  it("joins the cells which are the same in a row, and skips the empty ones", () => {
    const cells = Uint8Array.from([
      1, 1, 0, 2, 2, 2,
      0, 0, 0, 0, 0, 0,
      3, 3, 3, 3, 3, 3,
    ]);

    expect(toRuns(cells, 6, 3)).toEqual([
      { col: 0, row: 0, length: 2, cell: 1 },
      { col: 3, row: 0, length: 3, cell: 2 },
      { col: 0, row: 2, length: 6, cell: 3 },
    ]);
  });

  it("does not join a row with the next", () => {
    const cells = Uint8Array.from([1, 1, 1, 1]);

    expect(toRuns(cells, 2, 2)).toHaveLength(2);
  });
});
