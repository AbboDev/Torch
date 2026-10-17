import { describe, expect, it } from "vitest";
import {
  Box,
  TerrainProbe,
  sensePatrol,
  senseSide,
} from "@/enemies/senses";

/**
 * A world drawn with characters, a tile of 10 pixels each:
 * "#" is a wall, "=" is a platform (only ground), "." is nothing
 */
function worldOf(rows: string[]): TerrainProbe {
  const at = (x: number, y: number) =>
    rows[Math.floor(y / 10)]?.[Math.floor(x / 10)] ?? ".";

  return {
    isWall: (x, y) => at(x, y) === "#",
    isGround: (x, y) => at(x, y) === "#" || at(x, y) === "=",
  };
}

/** A body of 10 x 10 pixels on the tile (col, row) */
const bodyAt = (col: number, row: number): Box => ({
  left: col * 10,
  top: row * 10,
  right: col * 10 + 10,
  bottom: row * 10 + 10,
});

describe("senseSide", () => {
  it("feels the ground ahead on a floor", () => {
    const world = worldOf([
      "..........",
      "..........",
      "##########",
    ]);

    expect(senseSide(bodyAt(4, 1), 1, world)).toEqual({ wall: false, ground: true });
    expect(senseSide(bodyAt(4, 1), -1, world)).toEqual({ wall: false, ground: true });
  });

  it("feels a wall touching the body at its side", () => {
    const world = worldOf([
      "......#...",
      "......#...",
      "##########",
    ]);

    expect(senseSide(bodyAt(5, 1), 1, world).wall).toBe(true);
    expect(senseSide(bodyAt(5, 1), -1, world).wall).toBe(false);
  });

  it("feels a wall which is only as high as the feet or as the head", () => {
    const low = worldOf(["..........", ".....#....", "##########"]);
    const high = worldOf([".....#....", "..........", "##########"]);

    // a wall of one tile in the row of the body is where its height is
    expect(senseSide(bodyAt(4, 1), 1, low).wall).toBe(true);
    expect(senseSide(bodyAt(4, 1), 1, high).wall).toBe(false);
  });

  it("does not take the floor or the ceiling for a wall", () => {
    const world = worldOf([
      "#####.####",
      "..........",
      "##########",
    ]);

    expect(senseSide(bodyAt(4, 1), 1, world).wall).toBe(false);
  });

  it("is not a wall one step farther than the body", () => {
    const world = worldOf([
      "..........",
      ".......#..",
      "##########",
    ]);

    expect(senseSide(bodyAt(5, 1), 1, world).wall).toBe(false);
    expect(senseSide(bodyAt(6, 1), 1, world).wall).toBe(true);
  });

  it("feels a hole where the floor ends", () => {
    const world = worldOf([
      "..........",
      "..........",
      "#####.....",
    ]);

    // the body is on the last tile of the floor: the next step is a hole
    expect(senseSide(bodyAt(4, 1), 1, world)).toEqual({ wall: false, ground: false });
    expect(senseSide(bodyAt(4, 1), -1, world).ground).toBe(true);
  });

  it("is still on the ground until its edge passes the end of the floor", () => {
    const world = worldOf([
      "..........",
      "..........",
      "#####.....",
    ]);
    const half: Box = { left: 35, top: 10, right: 45, bottom: 20 };

    expect(senseSide(half, 1, world).ground).toBe(true);
  });

  it("takes a platform for ground, but not for a wall", () => {
    const world = worldOf([
      "..........",
      "..........",
      "====......",
    ]);

    expect(senseSide(bodyAt(2, 1), 1, world)).toEqual({ wall: false, ground: true });
  });

  it("takes the word of the physics that it is blocked", () => {
    const world = worldOf(["..........", "..........", "##########"]);

    expect(senseSide(bodyAt(4, 1), 1, world, true).wall).toBe(true);
    expect(senseSide(bodyAt(4, 1), 1, world, false).wall).toBe(false);
  });
});

describe("sensePatrol", () => {
  it("feels both sides, and the ground under the enemy", () => {
    const world = worldOf([
      "..........",
      ".....#....",
      "##########",
    ]);

    const senses = sensePatrol(bodyAt(4, 1), world, true);

    expect(senses.onGround).toBe(true);
    expect(senses.left).toEqual({ wall: false, ground: true });
    expect(senses.right).toEqual({ wall: true, ground: true });
  });

  it("is boxed in between two walls", () => {
    const world = worldOf(["..........", "...#.#....", "##########"]);
    const senses = sensePatrol(bodyAt(4, 1), world, true);

    expect(senses.left.wall).toBe(true);
    expect(senses.right.wall).toBe(true);
  });

  it("passes on what the physics says for each side", () => {
    const world = worldOf(["..........", "..........", "##########"]);
    const senses = sensePatrol(bodyAt(4, 1), world, false, {
      left: true,
      right: false,
    });

    expect(senses.onGround).toBe(false);
    expect(senses.left.wall).toBe(true);
    expect(senses.right.wall).toBe(false);
  });
});
