import { describe, expect, it, vi } from "vitest";
import {
  DirectionAxisX,
  DirectionAxisY,
  getSign,
  getSignX,
  getSignY,
} from "../../src/Miscellaneous/Direction";

vi.mock("phaser", () => ({
  Math: {
    Vector2: class Vector2 {
      constructor(
        public x: number,
        public y: number
      ) {}
    },
  },
}));

describe("direction signs", () => {
  it("maps horizontal directions to movement signs", () => {
    expect(getSignX(DirectionAxisX.RIGHT)).toBe(1);
    expect(getSignX(DirectionAxisX.LEFT)).toBe(-1);
    expect(getSignX(DirectionAxisX.CENTER)).toBe(0);
    expect(getSignX(null)).toBe(0);
  });

  it("maps vertical directions to movement signs", () => {
    expect(getSignY(DirectionAxisY.DOWN)).toBe(1);
    expect(getSignY(DirectionAxisY.UP)).toBe(-1);
    expect(getSignY(DirectionAxisY.MIDDLE)).toBe(0);
    expect(getSignY(null)).toBe(0);
  });

  it("combines both axis signs", () => {
    expect(
      getSign({ x: DirectionAxisX.RIGHT, y: DirectionAxisY.UP })
    ).toMatchObject({ x: 1, y: -1 });
  });
});
