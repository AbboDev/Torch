import { describe, expect, it, vi } from "vitest";
import { SlopeBody, Slopes } from "@/world/Slopes";
import { SlopeGrid } from "@/world/slopeGeometry";
import {
  FakeBody,
  Vec,
  createBody,
  step as arcadeStep,
} from "../helpers/arcade";

vi.mock("phaser", () => ({
  Physics: { Arcade: { Events: { WORLD_STEP: "worldstep" } } },
  Scenes: { Events: { SHUTDOWN: "shutdown" } },
  Math: {
    Vector2: class Vector2 {
      public constructor(
        public x: number,
        public y: number
      ) {}
    },
  },
}));

// The same ramp of the geometry tests: a floor at y = 160 up to x = 160, a 45
// degrees ramp up to y = 96 at x = 224, and a flat top after it (all slopes)
function ramp() {
  const grid = new SlopeGrid(16, 16);

  for (let column = 5; column < 10; column++) {
    grid.set(column, 10, { left: 16, right: 16 });
  }

  grid.set(10, 9, { left: 0, right: 16 });
  grid.set(11, 8, { left: 0, right: 16 });
  grid.set(12, 7, { left: 0, right: 16 });
  grid.set(13, 6, { left: 0, right: 16 });
  grid.set(14, 6, { left: 16, right: 16 });
  grid.set(15, 6, { left: 16, right: 16 });

  return grid;
}

const groundAt = (x: number) =>
  x < 160 ? 160 : x < 224 ? 160 - (x - 160) : 96;

/** The higher side, which is the ground the body stands on */
const supportedGround = (bodyLeft: number, width = 16) =>
  Math.min(groundAt(bodyLeft + 0.5), groundAt(bodyLeft + width - 0.5));

/** What Slopes.step stands on: the center while climbing onto the next tile */
const standingGround = (bodyLeft: number, velocityX: number, width = 16) => {
  const centerX = bodyLeft + width / 2;
  const center = groundAt(centerX);
  const leftX = bodyLeft + 0.5;
  const rightX = bodyLeft + width - 0.5;
  const left = groundAt(leftX);
  const right = groundAt(rightX);
  const sideX = left < right ? leftX : rightX;
  const climbing =
    velocityX !== 0 &&
    Math.min(left, right) < center - 0.5 &&
    Math.sign(Math.floor(sideX / 16) - Math.floor(centerX / 16)) ===
      Math.sign(velocityX);

  return climbing ? center : Math.min(left, right);
};

function slopeBody(over: Partial<SlopeBody> = {}) {
  const updateCenter = vi.fn();
  const body: SlopeBody = {
    enable: true,
    allowGravity: true,
    x: 0,
    y: 0,
    width: 16,
    height: 32,
    velocity: { x: 0, y: 0 },
    wasTouching: { down: true },
    touching: { down: false, none: true },
    blocked: { down: false, none: true },
    updateCenter,
    ...over,
  };

  return { body, updateCenter };
}

describe("Slopes.step", () => {
  it("puts a body inside a slope on its ground and tells it is on the floor", () => {
    const slopes = new Slopes(ramp());
    // The high side of the first ramp tile holds the body
    const { body, updateCenter } = slopeBody({ x: 160, y: 120 + 1 });
    body.velocity.y = 40;
    slopes.track(body);

    slopes.step(1 / 60);

    expect(body.y + body.height).toBeCloseTo(supportedGround(body.x), 6);
    expect(body.velocity.y).toBe(0);
    expect(body.blocked).toEqual({ down: true, none: false });
    expect(body.touching).toEqual({ down: true, none: false });
    expect(updateCenter).toHaveBeenCalled();
  });

  it("anchors from the current solid-floor contact when descending", () => {
    const slopes = new Slopes(ramp());
    const { body } = slopeBody({
      x: 96,
      y: 160 - 32 - 1,
      wasTouching: { down: false },
      blocked: { down: true, none: false },
    });
    slopes.track(body);

    slopes.step(1 / 60);

    expect(body.y + body.height).toBe(160);
    expect(body.blocked.down).toBe(true);
  });

  it("does not drop to the lower side while one side still stands on the high ground", () => {
    const slopes = new Slopes(ramp());
    // The center is already on the ramp; the right side is still on the top
    const { body } = slopeBody({ x: 210, y: 96 - 32 });
    slopes.track(body);

    slopes.step(1 / 60);

    expect(body.y + body.height).toBeCloseTo(96, 6);
    expect(body.blocked.down).toBe(true);
  });

  it("climbs with the center instead of jumping onto the higher side", () => {
    const slopes = new Slopes(ramp());
    const { body } = slopeBody({
      x: 210,
      y: groundAt(218) - 32,
      velocity: { x: 40, y: 0 },
    });
    slopes.track(body);

    slopes.step(1 / 60);

    expect(body.y + body.height).toBeCloseTo(groundAt(218), 6);
  });

  it("does nothing to a body which is not tracked, or after untrack", () => {
    const slopes = new Slopes(ramp());
    const { body } = slopeBody({ x: 160, y: 121 });

    slopes.step(1 / 60);
    expect(body.y).toBe(121);

    slopes.track(body);
    slopes.untrack(body);
    slopes.step(1 / 60);
    expect(body.y).toBe(121);
  });

  it("leaves alone a body which is disabled, has no gravity or is going up", () => {
    const slopes = new Slopes(ramp());
    const disabled = slopeBody({ x: 160, y: 121, enable: false }).body;
    const noGravity = slopeBody({ x: 160, y: 121, allowGravity: false }).body;
    const rising = slopeBody({ x: 160, y: 121 }).body;
    rising.velocity.y = -100;

    [disabled, noGravity, rising].forEach((body) => slopes.track(body));
    slopes.step(1 / 60);

    expect(disabled.y).toBe(121);
    expect(noGravity.y).toBe(121);
    expect(rising.y).toBe(121);
    expect(rising.velocity.y).toBe(-100);
  });

  it("does nothing when the map has no slopes", () => {
    const { body } = slopeBody({ x: 160, y: 121 });

    for (const slopes of [
      new Slopes(null),
      new Slopes(new SlopeGrid(16, 16)),
    ]) {
      slopes.track(body);
      slopes.step(1 / 60);

      expect(slopes.isEmpty).toBe(true);
      expect(body.y).toBe(121);
    }
  });

  it("can stand on the highest ground of several points", () => {
    const slopes = new Slopes(ramp(), [-8, 8]);
    // center at x = 172: the ground is 148 there, 140 under the point at 180
    const { body } = slopeBody({ x: 164, y: 148 - 32 + 1 });
    slopes.track(body);

    slopes.step(1 / 60);

    expect(body.y + body.height).toBe(140);
  });

  it("says whether a point is inside a slope", () => {
    const slopes = new Slopes(ramp());

    expect(slopes.isInside(168, 153)).toBe(true);
    expect(slopes.isInside(168, 150)).toBe(false);
    expect(new Slopes(null).isInside(168, 153)).toBe(false);
  });

  it("runs the cleanups once when destroyed", () => {
    const slopes = new Slopes(ramp());
    const cleanup = vi.fn();
    slopes.onDestroy(cleanup);

    slopes.destroy();
    slopes.destroy();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

/**
 * A body of the size of the Player, moved with the real velocity rules of
 * Arcade Physics (acceleration, drag, gravity) and the slopes after every
 * step, in the order of the game: preUpdate (flags), motion, slopes.
 */
function physicsBody(x: number, groundY: number) {
  const base: FakeBody = createBody({
    maxVelocity: new Vec(192, 384),
    allowGravity: true,
    x,
    y: groundY - 32,
  });
  base.gravity.set(0, 512);
  base.drag.set(2400, 0);

  const body = base as FakeBody & SlopeBody;
  Object.assign(body, {
    enable: true,
    width: 16,
    height: 32,
    wasTouching: { down: true },
    touching: { down: true, none: false },
    blocked: { down: true, none: false },
    updateCenter: () => {},
  });

  // the slopes read x/y of the body: here they are the same fields
  return body;
}

function physicsStep(slopes: Slopes, body: ReturnType<typeof physicsBody>) {
  // Body.preUpdate: the flags of the last step become the old ones
  body.wasTouching.down = body.touching.down;
  body.touching = { down: false, none: true };
  body.blocked = { down: false, none: true };

  arcadeStep(body);
  slopes.step(1 / 60);
}

describe("a body walking on slopes with the real Arcade velocity rules", () => {
  it("goes up the ramp, always on the floor, following the ground", () => {
    const slopes = new Slopes(ramp());
    const body = physicsBody(110, 160);
    slopes.track(body);
    body.acceleration.set(512, 0);

    let steps = 0;
    while (body.x + 8 < 250 && steps < 400) {
      physicsStep(slopes, body);
      steps++;

      expect(body.blocked.down).toBe(true);
      expect(body.y + body.height).toBeCloseTo(
        standingGround(body.x, body.velocity.x),
        6
      );
    }

    expect(body.y + body.height).toBe(96);
  });

  it("goes down the ramp and does not leave it", () => {
    const slopes = new Slopes(ramp());
    const body = physicsBody(232, 96);
    slopes.track(body);
    body.acceleration.set(-512, 0);

    let steps = 0;
    while (body.x + 8 > 100 && steps < 400) {
      physicsStep(slopes, body);
      steps++;

      expect(body.blocked.down).toBe(true);
      expect(body.y + body.height).toBeCloseTo(supportedGround(body.x), 6);
    }

    expect(body.y + body.height).toBe(160);
  });

  it("starts downhill after stopping even if Arcade loses the slope contact", () => {
    const slopes = new Slopes(ramp());
    const body = physicsBody(200, groundAt(208));
    slopes.track(body);
    slopes.step(1 / 60);

    body.touching = { down: false, none: true };
    body.blocked = { down: false, none: true };
    body.acceleration.set(-512, 0);

    let steps = 0;
    while (body.x + 8 > 180 && steps < 120) {
      physicsStep(slopes, body);
      steps++;

      expect(body.blocked.down).toBe(true);
      expect(body.y + body.height).toBeCloseTo(supportedGround(body.x), 6);
    }

    expect(body.x + 8).toBeLessThanOrEqual(180);
  });

  it("stops quickly on the ramp when the button is released, and stays there", () => {
    const slopes = new Slopes(ramp());
    const body = physicsBody(160, 160);
    slopes.track(body);
    body.acceleration.set(512, 0);
    // a short run up the ramp, which ends well before the end of the top
    for (let step = 0; step < 20; step++) physicsStep(slopes, body);
    expect(body.velocity.x).toBeGreaterThan(100);

    body.acceleration.set(0, 0);
    for (let step = 0; step < 12; step++) physicsStep(slopes, body);
    const stoppedAt = body.x;

    for (let step = 0; step < 120; step++) {
      physicsStep(slopes, body);

      expect(body.x).toBe(stoppedAt);
      expect(body.blocked.down).toBe(true);
      expect(body.velocity.y).toBe(0);
      expect(body.y + body.height).toBeCloseTo(supportedGround(body.x), 6);
    }
  });

  it("jumps off the ramp and comes back to it", () => {
    const slopes = new Slopes(ramp());
    const body = physicsBody(180, groundAt(188));
    slopes.track(body);
    physicsStep(slopes, body);

    body.velocity.y = -250;
    physicsStep(slopes, body);

    // in the air at once: not pulled back to the ground
    expect(body.blocked.down).toBe(false);
    expect(body.y + body.height).toBeLessThan(supportedGround(body.x));

    let steps = 0;
    while (!body.blocked.down && steps < 200) {
      physicsStep(slopes, body);
      steps++;
    }

    expect(body.blocked.down).toBe(true);
    expect(body.y + body.height).toBeCloseTo(supportedGround(body.x), 6);
  });
});
