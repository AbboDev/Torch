import { describe, expect, it } from "vitest";
import { HopBrain, HopSenses, getJumpSpeed } from "@/enemies/hop";

const senses = (overrides: Partial<HopSenses> = {}): HopSenses => ({
  onGround: true,
  wallLeft: false,
  wallRight: false,
  time: 0,
  ...overrides,
});

describe("getJumpSpeed", () => {
  it("is the speed which takes it up to the height with the gravity", () => {
    const gravity = 512;
    const height = 32;
    const speed = getJumpSpeed(gravity, height);

    // v^2 = 2 g h: going up at this speed stops after the height
    expect(speed * speed).toBeCloseTo(2 * gravity * height);
    expect((speed * speed) / (2 * gravity)).toBeCloseTo(height);
  });

  it("is more for a higher jump, and for a stronger gravity", () => {
    expect(getJumpSpeed(512, 48)).toBeGreaterThan(getJumpSpeed(512, 32));
    expect(getJumpSpeed(1024, 32)).toBeGreaterThan(getJumpSpeed(512, 32));
  });
});

describe("HopBrain: the jumps", () => {
  it("waits on the ground for the first interval, and then jumps", () => {
    const brain = new HopBrain(1, 1000);

    expect(brain.think(senses({ time: 0 })).jump).toBe(false);
    expect(brain.think(senses({ time: 999 })).jump).toBe(false);
    expect(brain.think(senses({ time: 1000 })).jump).toBe(true);
  });

  it("jumps at regular intervals, counted from the jump", () => {
    const brain = new HopBrain(1, 1000);
    const jumps: number[] = [];

    for (let time = 0; time <= 5000; time += 100) {
      if (brain.think(senses({ time })).jump) {
        jumps.push(time);
      }
    }

    expect(jumps).toEqual([1000, 2000, 3000, 4000, 5000]);
  });

  it("does not jump from the air, and jumps as soon as it lands", () => {
    const brain = new HopBrain(1, 1000);
    brain.think(senses({ time: 0 }));

    expect(brain.think(senses({ time: 1000, onGround: false })).jump).toBe(false);
    expect(brain.think(senses({ time: 1400, onGround: false })).jump).toBe(false);
    expect(brain.think(senses({ time: 1500, onGround: true })).jump).toBe(true);
  });

  it("does not look at holes: it jumps on the ground and goes on in the air", () => {
    // there is nothing about the ground ahead in what it senses: it can fall
    const brain = new HopBrain(1, 500);
    brain.think(senses({ time: 0 }));

    const intent = brain.think(senses({ time: 500 }));

    expect(intent.jump).toBe(true);
    expect(intent.direction).toBe(1);
  });
});

describe("HopBrain: the way", () => {
  it("stays still on the ground between jumps, and goes forward in the air", () => {
    const brain = new HopBrain(-1, 1000);
    brain.think(senses({ time: 0 }));

    expect(brain.think(senses({ time: 500 })).direction).toBe(0);
    expect(brain.think(senses({ time: 1000 })).direction).toBe(-1);
    expect(brain.think(senses({ time: 1100, onGround: false })).direction).toBe(-1);
  });

  it("turns back at a wall, also in the air", () => {
    const brain = new HopBrain(1, 1000);
    brain.think(senses({ time: 0 }));

    const intent = brain.think(
      senses({ time: 1100, onGround: false, wallRight: true })
    );

    expect(intent.heading).toBe(-1);
    expect(intent.direction).toBe(-1);
  });

  it("does not mind a wall behind it", () => {
    const brain = new HopBrain(1, 1000);

    expect(brain.think(senses({ wallLeft: true })).heading).toBe(1);
  });

  it("keeps the way it turned to, after the wall", () => {
    const brain = new HopBrain(1, 1000);

    brain.think(senses({ wallRight: true }));
    brain.think(senses({ time: 100 }));

    expect(brain.heading).toBe(-1);
  });

  it("goes back and forth between two walls", () => {
    const brain = new HopBrain(1, 1000);
    const headings: number[] = [];

    for (const [wallLeft, wallRight] of [
      [false, false],
      [false, true],
      [false, false],
      [true, false],
      [false, false],
    ]) {
      headings.push(brain.think(senses({ wallLeft, wallRight })).heading);
    }

    expect(headings).toEqual([1, -1, -1, 1, 1]);
  });

  it("stays between two walls: it jumps in the same place", () => {
    const brain = new HopBrain(1, 500);
    brain.think(senses({ time: 0, wallLeft: true, wallRight: true }));

    const intent = brain.think(senses({ time: 500, wallLeft: true, wallRight: true }));

    expect(intent.jump).toBe(true);
    expect(intent.direction).toBe(0);
    expect(intent.heading).toBe(1);
  });
});

describe("HopBrain: in a small world", () => {
  /** A point of mass hopping on a floor between two walls, with the intent of the brain */
  function hop(seconds: number, wallAt: number | null) {
    const gravity = 512;
    const jumpSpeed = getJumpSpeed(gravity, 32);
    const brain = new HopBrain(1, 1200);
    const state = { x: 100, y: 0, vy: 0 };
    const dt = 16;
    const xs: number[] = [];
    const jumpTimes: number[] = [];

    for (let time = 0; time < seconds * 1000; time += dt) {
      const onGround = state.y <= 0 && state.vy <= 0;
      const hitsRight = wallAt !== null && state.x >= wallAt;
      const hitsLeft = false;
      const intent = brain.think({
        onGround,
        wallLeft: hitsLeft,
        wallRight: hitsRight,
        time,
      });

      if (intent.jump) {
        state.vy = jumpSpeed;
        jumpTimes.push(time);
      }

      // the wall stops it, it is not inside it
      const speed = 64 * intent.direction;
      state.x = Math.min(wallAt ?? Infinity, state.x + (speed * dt) / 1000);
      state.vy -= (gravity * dt) / 1000;
      state.y = Math.max(0, state.y + (state.vy * dt) / 1000);
      if (state.y === 0 && state.vy < 0) {
        state.vy = 0;
      }
      xs.push(state.x);
    }

    return { xs, jumpTimes };
  }

  it("jumps every 1.2 seconds", () => {
    const { jumpTimes } = hop(6, null);

    for (let i = 1; i < jumpTimes.length; i++) {
      expect(jumpTimes[i] - jumpTimes[i - 1]).toBeGreaterThanOrEqual(1200);
      expect(jumpTimes[i] - jumpTimes[i - 1]).toBeLessThan(1200 + 32);
    }
    expect(jumpTimes.length).toBeGreaterThanOrEqual(4);
  });

  it("goes forward only while it is in the air", () => {
    const { xs } = hop(1.1, null);

    // for the first second it waits on the ground
    expect(xs[0]).toBe(xs[Math.floor(1000 / 16)]);
  });

  it("goes forward, and back from a wall", () => {
    const { xs } = hop(10, 140);

    // it reaches the wall, and later it is farther from it again
    expect(Math.max(...xs)).toBeCloseTo(140, 0);
    expect(xs[xs.length - 1]).toBeLessThan(140);
  });
});
