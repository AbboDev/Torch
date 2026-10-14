import { describe, expect, it } from "vitest";
import { ExploredGrid } from "@/world/explored";
import { buildMinimapMap } from "@/world/minimap";
import {
  Cell,
  PLAYER_COLORS,
  POI_COLORS,
  getMarkers,
  getWindowOrigin,
  renderCells,
  toRuns,
} from "@/world/minimapView";

/**
 * A map of 12 x 6 tiles of 10 pixels, with a room in the columns 2 to 9 (the
 * whole height), a wall at (4, 2), water at (5, 2) and a save point at (7, 3)
 */
function setup() {
  const map = buildMinimapMap({
    cols: 12,
    rows: 6,
    tileSize: 10,
    isFilled: (layer, col, row) =>
      (layer === "collision" && col === 4 && row === 2) ||
      (layer === "liquids" && col === 5 && row === 2),
    rooms: [{ x: 20, y: 0, width: 80, height: 60 }],
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
};

const cellAt = (cells: Uint8Array, col: number, row: number) =>
  cells[row * window.cols + col];

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

    expect(renderCells(map, explored, frame, window).every((c) => c === 0)).toBe(
      true
    );
  });

  it("draws what has been seen, bright where the screen shows it and dim elsewhere", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);

    const cells = renderCells(map, explored, frame, window);

    // the window starts at (3, 2): the column 3 is not in the screen, the 4 to 6 are
    expect(cellAt(cells, 0, 1)).toBe(Cell.FLOOR_DIM);
    expect(cellAt(cells, 1, 1)).toBe(Cell.FLOOR_LIT);
    expect(cellAt(cells, 3, 1)).toBe(Cell.FLOOR_LIT);
    expect(cellAt(cells, 4, 1)).toBe(Cell.FLOOR_DIM);
    // the rows 2 to 4 are in the screen: all the rows of the window
    expect(cellAt(cells, 2, 2)).toBe(Cell.FLOOR_LIT);
  });

  it("draws the walls, the water and the borders of the rooms", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);

    const cells = renderCells(map, explored, frame, window);

    expect(cellAt(cells, 1, 0)).toBe(Cell.WALL_LIT);
    expect(cellAt(cells, 2, 0)).toBe(Cell.LIQUID_LIT);
    // the border of the room is at the row 5 (the window ends at the row 4)
    const { map: m2, explored: e2 } = setup();
    e2.revealRect(0, 0, 12, 6);
    const low = renderCells(
      m2,
      e2,
      { ...frame, player: { x: 55, y: 45 } },
      window
    );
    expect(cellAt(low, 2, 2)).toBe(Cell.EDGE_DIM);
  });

  it("does not draw outside the rooms, or outside the map", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);

    // the window is at the left of the room: the columns 0 and 1 are not in it
    const left = renderCells(
      map,
      explored,
      { player: { x: 25, y: 35 }, visible: { x: 0, y: 0, width: 0, height: 0 } },
      window
    );

    expect(cellAt(left, 0, 1)).toBe(Cell.NONE);
    expect(cellAt(left, 1, 1)).toBe(Cell.NONE);
    expect(cellAt(left, 2, 1)).not.toBe(Cell.NONE);

    // the window at the top left of the map: before the column 0 is out
    const corner = renderCells(
      map,
      explored,
      { player: { x: 5, y: 5 }, visible: { x: 0, y: 0, width: 0, height: 0 } },
      window
    );
    expect(cellAt(corner, 0, 0)).toBe(Cell.NONE);
  });

  it("draws everything dim when the screen shows nothing of it", () => {
    const { map, explored } = setup();
    explored.revealRect(0, 0, 12, 6);

    const cells = renderCells(
      map,
      explored,
      { ...frame, visible: { x: 1000, y: 1000, width: 30, height: 30 } },
      window
    );

    expect([...cells].filter((cell) => cell % 2 === 0 && cell !== 0)).toEqual([]);
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
