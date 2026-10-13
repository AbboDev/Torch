import { describe, expect, it, vi } from "vitest";
import { AimLock, LOCK_BREAK_DELAY } from "@/entities/player/aimLock";
import {
  AIM_TARGET_RANGE,
  AimHit,
  AimProbe,
  SOLID,
} from "@/entities/player/aimTarget";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

const origin = { x: 0, y: 0 };

/**
 * A world with a target (a block, or an enemy which can move) and, if asked, a wall
 * between: both are 8 pixels wide and tall, and centered on their position.
 */
function world(
  target = { x: 100, y: 0 },
  wall: { x: number; y: number } | null = null
) {
  const state = { target: target as { x: number; y: number } | null, wall };
  const hit: AimHit = {
    kind: "enemy",
    id: "target",
    position: () => state.target,
  };
  const near = (p: { x: number; y: number } | null, x: number, y: number) =>
    p !== null && Math.abs(x - p.x) <= 4 && Math.abs(y - p.y) <= 4;
  const probe: AimProbe = (x, y) => {
    if (near(state.wall, x, y)) {
      return SOLID;
    }

    return near(state.target, x, y) ? hit : null;
  };

  return { state, hit, probe };
}

describe("AimLock", () => {
  it("locks on what the aim points at, and aims at it", () => {
    const { hit, probe } = world({ x: 100, y: 100 });
    const lock = new AimLock();

    lock.toggle(hit);
    const aim = lock.update(origin, probe, 0);

    expect(lock.isLocked).toBe(true);
    expect(aim?.angle).toBeCloseTo(Math.PI / 4);
    expect(aim?.target).toEqual({ x: 100, y: 100 });
  });

  it("locks on nothing, and on a wall", () => {
    const lock = new AimLock();

    lock.toggle(null);
    expect(lock.isLocked).toBe(false);

    lock.toggle(SOLID);
    expect(lock.isLocked).toBe(false);
  });

  it("lets go with the second press", () => {
    const { hit, probe } = world();
    const lock = new AimLock();
    lock.toggle(hit);

    lock.toggle(null);

    expect(lock.isLocked).toBe(false);
    expect(lock.update(origin, probe, 0)).toBeNull();
  });

  it("follows the Player and the target when they move", () => {
    const { state, hit, probe } = world({ x: 100, y: 0 });
    const lock = new AimLock();
    lock.toggle(hit);

    expect(lock.update(origin, probe, 0)?.angle).toBeCloseTo(0);

    // the Player goes up: the target is below
    expect(lock.update({ x: 0, y: -100 }, probe, 16)?.angle).toBeCloseTo(
      Math.PI / 4
    );

    // the target goes up too
    state.target = { x: 100, y: -200 };
    expect(lock.update({ x: 0, y: -100 }, probe, 32)?.angle).toBeCloseTo(
      -Math.PI / 4
    );
  });

  it("ends when the target is gone: a block which is broken", () => {
    const { state, hit, probe } = world();
    const lock = new AimLock();
    lock.toggle(hit);

    state.target = null;

    expect(lock.update(origin, probe, 0)).toBeNull();
    expect(lock.isLocked).toBe(false);
  });

  it("ends when the target is too far", () => {
    const { hit, probe } = world({ x: AIM_TARGET_RANGE - 10, y: 0 });
    const lock = new AimLock();
    lock.toggle(hit);
    expect(lock.update(origin, probe, 0)).not.toBeNull();

    expect(lock.update({ x: -30, y: 0 }, probe, 16)).toBeNull();
    expect(lock.isLocked).toBe(false);
  });

  it("can not lock on what a wall hides: there is nothing to lock on", () => {
    // the aim points at the wall first, so what it gives is the wall
    const { probe } = world({ x: 100, y: 0 }, { x: 50, y: 0 });
    const lock = new AimLock();

    lock.toggle(probe(50, 0));

    expect(lock.isLocked).toBe(false);
  });

  it("holds for a short time when a wall comes between, then breaks", () => {
    const { state, hit, probe } = world();
    const lock = new AimLock();
    lock.toggle(hit);
    expect(lock.update(origin, probe, 0)).not.toBeNull();

    state.wall = { x: 50, y: 0 };
    expect(lock.update(origin, probe, 1000)).not.toBeNull();
    expect(lock.update(origin, probe, 1000 + LOCK_BREAK_DELAY - 1)).not.toBeNull();

    expect(lock.update(origin, probe, 1000 + LOCK_BREAK_DELAY)).toBeNull();
    expect(lock.isLocked).toBe(false);
  });

  it("does not break when the wall goes away in time", () => {
    const { state, hit, probe } = world();
    const lock = new AimLock();
    lock.toggle(hit);

    state.wall = { x: 50, y: 0 };
    lock.update(origin, probe, 1000);
    state.wall = null;
    lock.update(origin, probe, 1000 + LOCK_BREAK_DELAY - 10);

    // the time starts again with the next wall
    state.wall = { x: 50, y: 0 };
    expect(lock.update(origin, probe, 1000 + LOCK_BREAK_DELAY + 100)).not.toBeNull();
    expect(lock.isLocked).toBe(true);
  });

  it("is not blocked by the target itself, even close to it", () => {
    const { hit, probe } = world({ x: 6, y: 0 });
    const lock = new AimLock();
    lock.toggle(hit);

    for (let time = 0; time < 1000; time += 16) {
      expect(lock.update(origin, probe, time)).not.toBeNull();
    }
  });
});
