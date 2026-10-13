import { describe, expect, it, vi } from "vitest";
import {
  KEYBOARD_AIM_SPEED,
  angleBetween,
  aimPose,
  elevationToAngle,
  octantSign,
  pointOnCircle,
  poseElevation,
  stepElevation,
  stickAngle,
} from "@/entities/player/aimAngles";
import { DirectionAxisX, DirectionAxisY } from "@/miscellaneous/Direction";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

const { PI } = Math;

describe("stickAngle", () => {
  it("is null while the stick is near the center (drift)", () => {
    expect(stickAngle(0, 0)).toBeNull();
    expect(stickAngle(0.2, -0.2)).toBeNull();
  });

  it("is the angle of the stick, with the y axis pointing down", () => {
    expect(stickAngle(1, 0)).toBe(0);
    expect(stickAngle(0, 1)).toBeCloseTo(PI / 2);
    expect(stickAngle(0, -1)).toBeCloseTo(-PI / 2);
    expect(stickAngle(-1, 0)).toBeCloseTo(PI);
  });
});

describe("angleBetween", () => {
  it("is the angle from a point to another", () => {
    expect(angleBetween({ x: 10, y: 10 }, { x: 10, y: 0 }, 0)).toBeCloseTo(
      -PI / 2
    );
    expect(angleBetween({ x: 0, y: 0 }, { x: 5, y: 5 }, 0)).toBeCloseTo(PI / 4);
  });

  it("is the fallback when the points are almost the same", () => {
    expect(angleBetween({ x: 3, y: 3 }, { x: 3.5, y: 3 }, PI)).toBe(PI);
  });
});

describe("pointOnCircle", () => {
  it("is at the distance and the angle given", () => {
    const point = pointOnCircle({ x: 100, y: 50 }, PI / 2, 64);

    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(114);
  });
});

describe("octantSign", () => {
  it("gives the closest of the eight directions", () => {
    const signs = [0, 1, 2, 3, 4, -3, -2, -1].map((n) => octantSign(n * (PI / 4)));

    expect(signs).toEqual([
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
    ]);
  });

  it("rounds to the closest direction, and left is left on both sides of the circle", () => {
    expect(octantSign(0.3)).toEqual({ x: 1, y: 0 });
    expect(octantSign(0.5)).toEqual({ x: 1, y: 1 });
    expect(octantSign(-PI)).toEqual({ x: -1, y: 0 });
    expect(octantSign(PI)).toEqual({ x: -1, y: 0 });
  });
});

describe("aimPose", () => {
  it("looks to the side of the angle and tilts with it", () => {
    expect(aimPose(0, DirectionAxisX.LEFT)).toEqual({
      side: DirectionAxisX.RIGHT,
      facingY: DirectionAxisY.MIDDLE,
      diagonal: false,
    });
    expect(aimPose((-3 * PI) / 4, DirectionAxisX.RIGHT)).toEqual({
      side: DirectionAxisX.LEFT,
      facingY: DirectionAxisY.UP,
      diagonal: true,
    });
  });

  it("aims up and down straight, looking to the side it leans to", () => {
    const right = aimPose(-PI / 2 + 0.1, DirectionAxisX.LEFT);
    const left = aimPose(-PI / 2 - 0.1, DirectionAxisX.RIGHT);

    expect(right).toEqual({
      side: DirectionAxisX.RIGHT,
      facingY: DirectionAxisY.UP,
      diagonal: false,
    });
    expect(left.side).toBe(DirectionAxisX.LEFT);
    expect(aimPose(PI / 2, DirectionAxisX.LEFT).facingY).toBe(
      DirectionAxisY.DOWN
    );
  });

  it("keeps the side when it leans to neither", () => {
    expect(aimPose(-PI / 2, DirectionAxisX.LEFT).side).toBe(DirectionAxisX.LEFT);
    expect(aimPose(-PI / 2, DirectionAxisX.RIGHT).side).toBe(
      DirectionAxisX.RIGHT
    );
  });
});

describe("the aim of the keyboard", () => {
  it("raises and lowers the elevation with the time held", () => {
    const second = KEYBOARD_AIM_SPEED;

    expect(stepElevation(0, 1, 500)).toBeCloseTo(second / 2);
    expect(stepElevation(0, -1, 250)).toBeCloseTo(-second / 4);
    expect(stepElevation(0.3, 0, 1000)).toBe(0.3);
  });

  it("stops straight up and straight down", () => {
    expect(stepElevation(1, 1, 10000)).toBeCloseTo(PI / 2);
    expect(stepElevation(-1, -1, 10000)).toBeCloseTo(-PI / 2);
  });

  it("makes the angle of the side the Player looks at", () => {
    // up to the right: negative, the y axis points down
    expect(elevationToAngle(PI / 4, false)).toBeCloseTo(-PI / 4);
    // up to the left
    expect(elevationToAngle(PI / 4, true)).toBeCloseTo((5 * PI) / 4);
    expect(octantSign(elevationToAngle(PI / 4, true))).toEqual({ x: -1, y: -1 });
    expect(octantSign(elevationToAngle(-PI / 4, true))).toEqual({ x: -1, y: 1 });
  });
});

describe("poseElevation", () => {
  it("is the elevation the buttons aim at, so the fine aim starts from it", () => {
    const { UP, DOWN, MIDDLE } = DirectionAxisY;

    expect(poseElevation(MIDDLE, false)).toBe(0);
    expect(poseElevation(UP, true)).toBeCloseTo(PI / 4);
    expect(poseElevation(UP, false)).toBeCloseTo(PI / 2);
    expect(poseElevation(DOWN, true)).toBeCloseTo(-PI / 4);
    expect(poseElevation(DOWN, false)).toBeCloseTo(-PI / 2);
  });
});
