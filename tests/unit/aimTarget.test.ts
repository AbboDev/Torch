import { describe, expect, it, vi } from "vitest";
import {
  AimProbe,
  AimTargeting,
  findAimTarget,
  isInteractive,
} from "@/entities/player/aimTarget";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

/** Something at x >= 100 (a wall, a block...), on the line y = 0 */
const wallAt =
  (x: number, hit: "solid" | "breakable" | "enemy"): AimProbe =>
  (px) =>
    px >= x ? hit : null;

describe("findAimTarget", () => {
  it("finds the first thing along the aim", () => {
    const probe = wallAt(100, "breakable");

    expect(findAimTarget({ x: 0, y: 0 }, 0, probe)).toBe("breakable");
  });

  it("looks in the direction of the angle", () => {
    // aiming up, there is nothing at the sides
    const probe: AimProbe = (x, y) => (y <= -40 && Math.abs(x) < 1 ? "enemy" : null);

    expect(findAimTarget({ x: 0, y: 0 }, -Math.PI / 2, probe)).toBe("enemy");
    expect(findAimTarget({ x: 0, y: 0 }, 0, probe)).toBeNull();
  });

  it("is hidden by a wall in front of it", () => {
    const probe: AimProbe = (x) => (x >= 50 ? "solid" : x >= 100 ? "enemy" : null);

    expect(findAimTarget({ x: 0, y: 0 }, 0, probe)).toBe("solid");
  });

  it("does not look farther than the range", () => {
    const probe = wallAt(100, "enemy");

    expect(findAimTarget({ x: 0, y: 0 }, 0, probe, 64)).toBeNull();
    expect(findAimTarget({ x: 0, y: 0 }, 0, probe, 128)).toBe("enemy");
  });

  it("does not skip a thing thinner than a tile", () => {
    const probe: AimProbe = (x) => (x >= 41 && x <= 44 ? "enemy" : null);

    expect(findAimTarget({ x: 0, y: 0 }, 0, probe)).toBe("enemy");
  });
});

describe("isInteractive", () => {
  it("is true for what a shot breaks or hurts, not for the walls", () => {
    expect(isInteractive("breakable")).toBe(true);
    expect(isInteractive("enemy")).toBe(true);
    expect(isInteractive("solid")).toBe(false);
    expect(isInteractive(null)).toBe(false);
  });
});

describe("AimTargeting", () => {
  const ray = { from: { x: 0, y: 0 }, angle: 0 };

  it("tells when the aim points at something which can be hit", () => {
    const targeting = new AimTargeting(wallAt(100, "breakable"), vi.fn());

    targeting.update(ray, 0);
    expect(targeting.isTargeting).toBe(true);

    targeting.update({ ...ray, angle: Math.PI }, 16);
    expect(targeting.isTargeting).toBe(false);
  });

  it("is not fooled by a wall", () => {
    const targeting = new AimTargeting(wallAt(100, "solid"), vi.fn());

    targeting.update(ray, 0);

    expect(targeting.isTargeting).toBe(false);
  });

  it("calls onAcquire once, when it starts to point at it", () => {
    const onAcquire = vi.fn();
    const targeting = new AimTargeting(wallAt(100, "enemy"), onAcquire);

    targeting.update(ray, 0);
    targeting.update(ray, 16);
    targeting.update(ray, 32);

    expect(onAcquire).toHaveBeenCalledTimes(1);
  });

  it("calls it again after the aim has left it", () => {
    const onAcquire = vi.fn();
    const targeting = new AimTargeting(wallAt(100, "enemy"), onAcquire, 300);

    targeting.update(ray, 0);
    targeting.update({ ...ray, angle: Math.PI }, 400);
    targeting.update(ray, 800);

    expect(onAcquire).toHaveBeenCalledTimes(2);
  });

  it("does not call it again while the aim shivers on the edge", () => {
    const onAcquire = vi.fn();
    const targeting = new AimTargeting(wallAt(100, "enemy"), onAcquire, 300);

    targeting.update(ray, 0);
    targeting.update({ ...ray, angle: Math.PI }, 50);
    targeting.update(ray, 100);

    expect(onAcquire).toHaveBeenCalledTimes(1);
    expect(targeting.isTargeting).toBe(true);
  });

  it("points at nothing when there is no aim", () => {
    const targeting = new AimTargeting(wallAt(100, "enemy"), vi.fn());
    targeting.update(ray, 0);

    targeting.update(null, 16);

    expect(targeting.isTargeting).toBe(false);
  });
});
