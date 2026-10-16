import { describe, expect, it } from "vitest";
import {
  SlopeGrid,
  canPassSlopeLip,
  findGround,
  getReachDown,
  groundY,
  isInsideSlope,
  parseSlopeProperties,
  resolveSlope,
} from "@/world/slopeGeometry";
import { walk } from "../helpers/slopeWalk";

/**
 * A 45 degrees ramp going up to the right over four tiles, with a floor
 * before it at y = 160 and a flat top after it at y = 96.
 *
 *   x:   80 ... 160 ... 224 ... 256
 *   y:   160 --- 160 -> 96 ---- 96
 *
 * The floor and the top are made of slope tiles too (flat, with the ground at
 * the top of the tile): next to a ramp all the ground is made of slopes, or
 * the body would be in the air for some frames when leaving the ramp.
 */
function ramp() {
  const grid = new SlopeGrid(16, 16);

  for (let column = 5; column < 10; column++) {
    grid.set(column, 10, { left: 16, right: 16 }); // the floor: 160
  }

  grid.set(10, 9, { left: 0, right: 16 }); // 160 -> 144
  grid.set(11, 8, { left: 0, right: 16 }); // 144 -> 128
  grid.set(12, 7, { left: 0, right: 16 }); // 128 -> 112
  grid.set(13, 6, { left: 0, right: 16 }); // 112 -> 96
  grid.set(14, 6, { left: 16, right: 16 }); // 96
  grid.set(15, 6, { left: 16, right: 16 }); // 96

  return grid;
}

const FLOOR = 160;
const surfaceAt = (x: number) =>
  x < 160 ? FLOOR : x < 224 ? FLOOR - (x - 160) : 96;

describe("parseSlopeProperties", () => {
  it("reads the two heights of a tile", () => {
    expect(parseSlopeProperties({ slopeLeft: 0, slopeRight: 16 }, 16)).toEqual({
      left: 0,
      right: 16,
    });
  });

  it("keeps the heights inside the tile", () => {
    expect(parseSlopeProperties({ slopeLeft: -4, slopeRight: 40 }, 16)).toEqual(
      {
        left: 0,
        right: 16,
      }
    );
  });

  it("is not a slope when a height is missing or is not a number", () => {
    expect(parseSlopeProperties({ slopeLeft: 4 }, 16)).toBeNull();
    expect(
      parseSlopeProperties({ slopeLeft: "4", slopeRight: 8 }, 16)
    ).toBeNull();
    expect(
      parseSlopeProperties({ slopeLeft: NaN, slopeRight: 8 }, 16)
    ).toBeNull();
    expect(parseSlopeProperties({ collides: true }, 16)).toBeNull();
    expect(parseSlopeProperties(undefined, 16)).toBeNull();
  });
});

describe("groundY", () => {
  it("is a straight line between the heights of the two edges", () => {
    const slope = { left: 0, right: 16 };

    expect(groundY(100, slope, 16, 16, 0)).toBe(116);
    expect(groundY(100, slope, 16, 16, 8)).toBe(108);
    expect(groundY(100, slope, 16, 16, 16)).toBe(100);
  });

  it("works for a gentle slope over two tiles", () => {
    expect(groundY(100, { left: 0, right: 8 }, 16, 16, 16)).toBe(108);
    expect(groundY(100, { left: 8, right: 16 }, 16, 16, 0)).toBe(108);
  });
});

describe("findGround", () => {
  const field = ramp();

  it("finds the ground under a point which is inside the tile", () => {
    // x = 168 is the middle of the first tile: the ground is at 152
    expect(findGround(field, 168, 158, 0)?.y).toBe(152);
  });

  it("ignores a point which is above the ground unless it can reach down", () => {
    expect(findGround(field, 168, 148, 0)).toBeNull();
    expect(findGround(field, 168, 148, 6)?.y).toBe(152);
    expect(findGround(field, 168, 148, 3)).toBeNull();
  });

  it("ignores a point under the tile", () => {
    // under the bottom of the first tile (y = 160)
    expect(findGround(field, 168, 170, 0)).toBeNull();
  });

  it("finds nothing where there are no slopes", () => {
    expect(findGround(field, 40, 100, 20)).toBeNull();
  });
});

describe("resolveSlope", () => {
  const field = ramp();
  const query = { velocityY: 0, wasGrounded: true, reachDown: 2 };

  it("never touches a body which is going up", () => {
    expect(
      resolveSlope(field, { ...query, xs: [168], feetY: 158, velocityY: -50 })
    ).toBeNull();
  });

  it("takes the highest ground of the points", () => {
    // standing in the middle of a tile with a point 8 px on each side: the
    // body is lifted to the point on the side where the ramp goes up
    const ground = resolveSlope(field, {
      ...query,
      xs: [164, 180],
      spread: 8,
      feetY: surfaceAt(172),
    });

    expect(ground?.y).toBe(surfaceAt(180));
  });

  it("only looks at the center when there is one point", () => {
    const ground = resolveSlope(field, {
      ...query,
      xs: [172],
      feetY: surfaceAt(172) + 1,
    });

    expect(ground?.y).toBe(surfaceAt(172));
  });

  it("only sticks to a ground just below when the body was grounded", () => {
    const above = { ...query, xs: [168], feetY: 151 };

    expect(resolveSlope(field, above)?.y).toBe(152);
    expect(resolveSlope(field, { ...above, wasGrounded: false })).toBeNull();
  });
});

describe("isInsideSlope", () => {
  const field = ramp();

  it("is true under the ground line and false above it", () => {
    // the ground at x = 168 is at y = 152
    expect(isInsideSlope(field, 168, 153)).toBe(true);
    expect(isInsideSlope(field, 168, 150)).toBe(false);
    expect(isInsideSlope(field, 40, 150)).toBe(false);
  });
});

describe("getReachDown", () => {
  it("grows with the speed and has a margin", () => {
    expect(getReachDown(0, 1 / 60, 1)).toBe(2);
    expect(getReachDown(-480, 1 / 60, 1)).toBe(10);
    expect(getReachDown(480, 1 / 60, 0.5)).toBe(6);
  });
});

describe("a body walking on the ramp (simulated like the game does it)", () => {
  const field = ramp();
  const options = {};

  it("goes up the ramp following the ground, always touching it", () => {
    // from the floor to the flat top: 130 px
    const states = walk(field, { x: 120, feetY: FLOOR, vx: 90 }, 86, options);

    for (const state of states) {
      expect(state.grounded).toBe(true);
      expect(state.feetY).toBeCloseTo(surfaceAt(state.x), 6);
    }

    // It got to the flat top
    expect(states.at(-1)!.x).toBeGreaterThan(245);
    expect(states.at(-1)!.feetY).toBe(96);
  });

  it.each([90, 192, 512])(
    "goes down the ramp at %i px/s without ever leaving it",
    (speed) => {
      // from the top to the floor, 120 px
      const states = walk(
        field,
        { x: 240, feetY: 96, vx: -speed },
        Math.floor((240 - 120) / (speed / 60)),
        options
      );

      for (const state of states) {
        expect(state.grounded).toBe(true);
        expect(state.feetY).toBeCloseTo(surfaceAt(state.x), 6);
      }
    }
  );

  it("stands still on the ramp without sinking, sliding or shaking", () => {
    const states = walk(field, { x: 190, feetY: surfaceAt(190) }, 120, options);

    for (const state of states) {
      expect(state.x).toBe(190);
      expect(state.feetY).toBe(surfaceAt(190));
      expect(state.vy).toBe(0);
      expect(state.grounded).toBe(true);
    }
  });

  it("leaves the ramp when jumping, and lands on it again", () => {
    const states = walk(
      field,
      { x: 190, feetY: surfaceAt(190), vy: -200, grounded: true },
      90,
      options
    );

    // It takes off at once: not pulled back to the ground...
    expect(states[0].grounded).toBe(false);
    expect(states[0].feetY).toBeLessThan(surfaceAt(190));
    expect(states.slice(0, 10).every((state) => !state.grounded)).toBe(true);
    // ... and it is on the ramp again at the end
    expect(states.at(-1)!.grounded).toBe(true);
    expect(states.at(-1)!.feetY).toBeCloseTo(surfaceAt(states.at(-1)!.x), 6);
  });

  it("falls off the end of the flat top", () => {
    const states = walk(field, { x: 240, feetY: 96, vx: 90 }, 60, options);

    expect(states.at(-1)!.x).toBeGreaterThan(256);
    expect(states.at(-1)!.grounded).toBe(false);
    expect(states.at(-1)!.feetY).toBeGreaterThan(96);
  });

  it("does not stick to a ground far below when walking off an edge", () => {
    const lower = new SlopeGrid(16, 16);
    lower.set(15, 9, { left: 16, right: 16 }); // the ground at y = 144

    // walking right off the flat top at y = 96, 48 px above the ground
    const withTop = ramp();
    for (const { column, row, slope } of lower.entries()) {
      withTop.set(column, row, slope);
    }
    const states = walk(withTop, { x: 250, feetY: 96, vx: 90 }, 12, options);

    expect(states.slice(-4).every((state) => !state.grounded)).toBe(true);
  });

  it("is smooth along a gentle slope over two tiles", () => {
    const gentle = new SlopeGrid(16, 16);
    gentle.set(9, 10, { left: 16, right: 16 }); // the floor: 160
    gentle.set(10, 9, { left: 0, right: 8 }); // 160 -> 152
    gentle.set(11, 9, { left: 8, right: 16 }); // 152 -> 144
    gentle.set(12, 9, { left: 16, right: 16 }); // 144
    gentle.set(13, 9, { left: 16, right: 16 }); // 144

    // from x = 150 to x = 200
    const states = walk(gentle, { x: 150, feetY: FLOOR, vx: 60 }, 50);

    expect(states.every((state) => state.grounded)).toBe(true);
    // 22.5 degrees: it goes up half a pixel per pixel
    const at176 = states.find((state) => state.x >= 176)!;
    expect(at176.feetY).toBeCloseTo(152, 0);
    expect(states.at(-1)!.feetY).toBe(144);
  });

  it("leaves the end of a ramp without being in the air", () => {
    // going down at the speed of a dash, from the top to the floor and beyond
    const states = walk(field, { x: 240, feetY: 96, vx: -512 }, 18);

    expect(states.every((state) => state.grounded)).toBe(true);
    expect(states.at(-1)!.feetY).toBe(FLOOR);
  });
});

describe("canPassSlopeLip", () => {
  it("lets the body enter the tile whose top is the slope it is climbing", () => {
    expect(canPassSlopeLip(288, 296, 288, 16)).toBe(true);
  });

  it("keeps a floor, a tall wall and a missing slope solid", () => {
    expect(canPassSlopeLip(192, 193, 208, 16)).toBe(false);
    expect(canPassSlopeLip(160, 192, 192, 16)).toBe(false);
    expect(canPassSlopeLip(288, 296, null, 16)).toBe(false);
    expect(canPassSlopeLip(288, 320, 288, 16)).toBe(false);
  });
});
