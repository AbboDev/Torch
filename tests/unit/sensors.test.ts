import { describe, expect, it } from "vitest";
import {
  AreaPosition,
  SensorConfig,
  computeSensors,
  containsStrict,
  findContainedAlongPath,
  getArea,
  overlapsStrict,
  unionRect,
} from "@/entities/player/sensors";

const config: SensorConfig = {
  wallDistance: 4,
  wallHeight: 16,
  ladderWidth: 16,
};
const body = { x: 100, y: 200, width: 16, height: 32 };

describe("computeSensors", () => {
  const sensors = computeSensors(body, config);

  it("puts the wall sensors on the sides, around the vertical center", () => {
    expect(sensors.leftWall).toEqual({ x: 96, y: 208, width: 4, height: 16 });
    expect(sensors.rightWall).toEqual({ x: 116, y: 208, width: 4, height: 16 });
  });

  it("puts the hand sensors above the top corners, one pixel out", () => {
    expect(sensors.leftHand).toEqual({ x: 95, y: 201, width: 4, height: 4 });
    expect(sensors.rightHand).toEqual({ x: 117, y: 201, width: 4, height: 4 });
  });

  it("puts a thin strip across the bottom of the body", () => {
    expect(sensors.feet).toEqual({ x: 100, y: 231, width: 16, height: 2 });
  });

  it("keeps the height of the wall sensors when the body shrinks", () => {
    const crouched = computeSensors({ ...body, y: 208, height: 24 }, config);

    expect(crouched.leftWall.height).toBe(16);
    expect(crouched.leftWall.y).toBe(208 + 12 - 8);
  });
});

describe("overlapsStrict", () => {
  const a = { x: 0, y: 0, width: 10, height: 10 };

  it("is true when the rectangles share some area", () => {
    expect(overlapsStrict(a, { x: 9, y: 9, width: 5, height: 5 })).toBe(true);
  });

  it("is false when they only touch", () => {
    expect(overlapsStrict(a, { x: 10, y: 0, width: 5, height: 5 })).toBe(false);
    expect(overlapsStrict(a, { x: 0, y: 10, width: 5, height: 5 })).toBe(false);
    expect(overlapsStrict(a, { x: -5, y: 0, width: 5, height: 5 })).toBe(false);
  });
});

describe("containsStrict", () => {
  const outer = { x: 0, y: 0, width: 16, height: 8 };

  it("is true when the rectangle is well inside", () => {
    expect(containsStrict(outer, { x: 4, y: 2, width: 4, height: 4 })).toBe(
      true
    );
  });

  it("is false when it touches or crosses a border", () => {
    expect(containsStrict(outer, { x: 0, y: 2, width: 4, height: 4 })).toBe(
      false
    );
    expect(containsStrict(outer, { x: 4, y: 4, width: 4, height: 4 })).toBe(
      false
    );
    expect(containsStrict(outer, { x: 4, y: 5, width: 4, height: 4 })).toBe(
      false
    );
  });

  it("is false when the rectangle is bigger", () => {
    expect(containsStrict(outer, { x: 1, y: 1, width: 20, height: 4 })).toBe(
      false
    );
  });
});

describe("getArea", () => {
  const tile = { x: 32, y: 48, width: 16, height: 16 };

  it("returns the requested part of the tile", () => {
    expect(getArea(tile, AreaPosition.FULL)).toEqual(tile);
    expect(getArea(tile, AreaPosition.TOP_HALF)).toEqual({
      x: 32,
      y: 48,
      width: 16,
      height: 8,
    });
    expect(getArea(tile, AreaPosition.BOTTOM_HALF)).toEqual({
      x: 32,
      y: 56,
      width: 16,
      height: 8,
    });
    expect(getArea(tile, AreaPosition.LEFT_HALF)).toEqual({
      x: 32,
      y: 48,
      width: 8,
      height: 16,
    });
    expect(getArea(tile, AreaPosition.RIGHT_HALF)).toEqual({
      x: 40,
      y: 48,
      width: 8,
      height: 16,
    });
    expect(getArea(tile, AreaPosition.RIGHT_BOTTOM_QUARTER)).toEqual({
      x: 40,
      y: 56,
      width: 8,
      height: 8,
    });
  });
});

describe("findContainedAlongPath", () => {
  // The top half of a tile: a sensor 4 pixels high fits only in a 4 px window
  const area = { x: 80, y: 80, width: 16, height: 8 };
  const sensorAt = (y: number) => ({ x: 82, y, width: 4, height: 4 });

  it("finds the sensor when it ends inside the area", () => {
    expect(findContainedAlongPath(area, sensorAt(70), sensorAt(81))).toEqual(
      sensorAt(81)
    );
  });

  it("finds it when it crossed the area faster than its size in one frame", () => {
    // Neither end is inside the area: 71 -> 91 in a single frame
    expect(containsStrict(area, sensorAt(71))).toBe(false);
    expect(containsStrict(area, sensorAt(91))).toBe(false);

    const found = findContainedAlongPath(area, sensorAt(71), sensorAt(91));

    expect(found).not.toBeNull();
    expect(containsStrict(area, found!)).toBe(true);
  });

  it("returns null when the path never goes through the area", () => {
    expect(findContainedAlongPath(area, sensorAt(50), sensorAt(70))).toBeNull();
    expect(
      findContainedAlongPath(area, sensorAt(95), sensorAt(120))
    ).toBeNull();
  });

  it("only looks at the position when the sensor did not move", () => {
    expect(
      findContainedAlongPath(area, sensorAt(81), sensorAt(81))
    ).not.toBeNull();
    expect(findContainedAlongPath(area, sensorAt(60), sensorAt(60))).toBeNull();
  });
});

describe("unionRect", () => {
  it("is the smallest rectangle containing both", () => {
    expect(
      unionRect(
        { x: 0, y: 0, width: 4, height: 4 },
        { x: 10, y: 6, width: 4, height: 4 }
      )
    ).toEqual({ x: 0, y: 0, width: 14, height: 10 });
  });
});
