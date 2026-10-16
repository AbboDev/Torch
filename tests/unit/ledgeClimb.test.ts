import { describe, expect, it } from "vitest";
import { hasLedgeToClimb, hasRoomToClimb } from "@/world/ledgeClimb";
import { trackRoom } from "@/world/roomChange";

const TILE = 16;

/** The map from rows of text: "#" is a tile of the world, "." is empty */
function map(rows: string[]) {
  return (column: number, row: number) => rows[row]?.[column] === "#";
}

const query = (
  rows: string[],
  centerX: number,
  centerY: number,
  isLeft: boolean
) => ({
  isLeft,
  centerX,
  centerY,
  tileSize: TILE,
  hasTile: map(rows),
});

describe("hasLedgeToClimb", () => {
  // The Player's body is 32 high: its center is at y = 72, the feet at 88.
  // The wall to the right is the column 4 (x 64..80); the Player is at x = 56.
  it("is false when the wall is taller: there is a tile at the level of the body", () => {
    const rows = [
      "......",
      "......",
      "......",
      "......",
      "....#.", // row 4: y 64..80, the level of the center
      "....#.",
      "....#.",
    ];

    // centerY - 1 = 71: row 4. The wall has a tile there: no room on top
    expect(hasLedgeToClimb(query(rows, 56, 72, false))).toBe(false);
  });

  it("is true for a ledge: a tile below the level of the body and none at it", () => {
    const rows = [
      "......",
      "......",
      "......",
      "......",
      "......", // row 4: nothing at the level of the center
      "....#.", // row 5: the tile to climb onto
      "....#.",
    ];

    expect(hasLedgeToClimb(query(rows, 56, 72, false))).toBe(true);
  });

  it("is false when there is no tile to climb onto", () => {
    const rows = ["......", "......", "......", "......", "......", "......"];

    expect(hasLedgeToClimb(query(rows, 56, 72, false))).toBe(false);
  });

  it("looks at the column on the left when the wall is on the left", () => {
    const rows = [
      "......",
      "......",
      "......",
      "......",
      "......",
      ".#....", // column 1: x 16..32
      ".#....",
    ];

    // centerX 40: the column of x = 40 - 16 = 24, which is 1
    expect(hasLedgeToClimb(query(rows, 40, 72, true))).toBe(true);
    expect(hasLedgeToClimb(query(rows, 40, 72, false))).toBe(false);
  });

  it("looks at the row just above the center, not at the center itself", () => {
    // centerY 64 is the top of row 4: its row is the one above (3)
    const rows = ["......", "......", "......", "......", "....#.", "......"];

    expect(hasLedgeToClimb(query(rows, 56, 64, false))).toBe(true);
  });
});

describe("hasRoomToClimb", () => {
  const hasRoom = (rows: string[]) =>
    hasRoomToClimb({
      x: 64,
      y: 48,
      width: 16,
      height: 32,
      tileSize: TILE,
      hasTile: map(rows),
    });

  it("allows the ledge tile which only touches the Player's feet", () => {
    expect(
      hasRoom(["......", "......", "......", "......", "......", "....#."])
    ).toBe(true);
  });

  it.each([3, 4])("rejects a tile intersecting body row %i", (blockedRow) => {
    const rows = Array<string>(6).fill("......");
    rows[blockedRow] = "....#.";

    expect(hasRoom(rows)).toBe(false);
  });
});

describe("trackRoom", () => {
  it("keeps the room when the Player stays in it", () => {
    expect(trackRoom(2, 1, 2)).toEqual({
      current: 2,
      previous: 1,
      changed: false,
    });
  });

  it("changes room, remembering the old one", () => {
    expect(trackRoom(2, 1, 3)).toEqual({
      current: 3,
      previous: 2,
      changed: true,
    });
  });

  it("keeps the room when none is found", () => {
    expect(trackRoom(2, null, null)).toEqual({
      current: 2,
      previous: null,
      changed: false,
    });
  });

  it("can go into the first room", () => {
    expect(trackRoom(2, null, 0)).toEqual({
      current: 0,
      previous: 2,
      changed: true,
    });
  });
});
