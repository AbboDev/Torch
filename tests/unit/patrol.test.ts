import { describe, expect, it } from "vitest";
import {
  PatrolBrain,
  PatrolSenses,
  SideSense,
  getOpposite,
  stepPatrol,
} from "@/enemies/patrol";

const free: SideSense = { wall: false, ground: true };
const wall: SideSense = { wall: true, ground: true };
const hole: SideSense = { wall: false, ground: false };

const senses = (
  left: SideSense,
  right: SideSense,
  onGround = true
): PatrolSenses => ({ onGround, left, right });

describe("stepPatrol", () => {
  it("walks on while the way is free", () => {
    expect(stepPatrol(1, senses(free, free))).toEqual({ heading: 1, moving: true });
    expect(stepPatrol(-1, senses(free, free))).toEqual({
      heading: -1,
      moving: true,
    });
  });

  it("turns back at a wall", () => {
    expect(stepPatrol(1, senses(free, wall))).toEqual({ heading: -1, moving: true });
    expect(stepPatrol(-1, senses(wall, free))).toEqual({ heading: 1, moving: true });
  });

  it("turns back at a hole", () => {
    expect(stepPatrol(1, senses(free, hole))).toEqual({ heading: -1, moving: true });
    expect(stepPatrol(-1, senses(hole, free))).toEqual({ heading: 1, moving: true });
  });

  it("does not mind a wall or a hole behind it", () => {
    expect(stepPatrol(1, senses(wall, free)).heading).toBe(1);
    expect(stepPatrol(-1, senses(free, hole)).heading).toBe(-1);
  });

  it("stays where it is when the way back is blocked too", () => {
    expect(stepPatrol(1, senses(wall, wall))).toEqual({ heading: 1, moving: false });
    expect(stepPatrol(-1, senses(hole, wall))).toEqual({ heading: -1, moving: false });
    expect(stepPatrol(1, senses(hole, hole))).toEqual({ heading: 1, moving: false });
  });

  it("goes on as it was in the air, whatever it senses", () => {
    expect(stepPatrol(1, senses(free, hole, false))).toEqual({
      heading: 1,
      moving: true,
    });
    expect(stepPatrol(-1, senses(wall, wall, false)).heading).toBe(-1);
  });

  it("knows the opposite way", () => {
    expect(getOpposite(1)).toBe(-1);
    expect(getOpposite(-1)).toBe(1);
  });
});

describe("PatrolBrain", () => {
  it("starts to the left, or where it is told", () => {
    expect(new PatrolBrain().heading).toBe(-1);
    expect(new PatrolBrain(1).heading).toBe(1);
  });

  it("walks back and forth between two walls", () => {
    const brain = new PatrolBrain(1);
    const headings: number[] = [];

    // the walls are at the ends of a corridor: the first at the right
    const atRight = senses(free, wall);
    const atLeft = senses(wall, free);
    const middle = senses(free, free);

    for (const sensed of [middle, middle, atRight, middle, middle, atLeft, middle]) {
      headings.push(brain.think(sensed).heading);
    }

    expect(headings).toEqual([1, 1, -1, -1, -1, 1, 1]);
  });

  it("keeps the new way after a turn", () => {
    const brain = new PatrolBrain(1);

    brain.think(senses(free, hole));

    expect(brain.heading).toBe(-1);
  });

  it("stays when it is boxed in, and goes again when the way opens", () => {
    const brain = new PatrolBrain(1);

    expect(brain.think(senses(wall, wall)).moving).toBe(false);
    expect(brain.think(senses(free, wall))).toEqual({ heading: -1, moving: true });
  });
});
