import { describe, expect, it, vi } from "vitest";
import {
  AimHit,
  AimHitKind,
  AimProbe,
  AimTargeting,
  SOLID,
  findAimTarget,
  isInteractive,
} from "@/entities/player/aimTarget";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

/** What a probe finds: a wall, or something which can be hit and followed */
const thing = (kind: AimHitKind, id = kind): AimHit =>
  kind === "solid" ? SOLID : { kind, id, position: () => ({ x: 0, y: 0 }) };

/** Something at x >= 100 (a wall, a block...), on the line y = 0 */
const wallAt =
  (x: number, kind: AimHitKind): AimProbe =>
  (px) =>
    px >= x ? thing(kind) : null;

describe("findAimTarget", () => {
  it("finds the first thing along the aim", () => {
    const probe = wallAt(100, "breakable");

    expect(findAimTarget({ x: 0, y: 0 }, 0, probe)?.kind).toBe("breakable");
  });

  it("looks in the direction of the angle", () => {
    // aiming up, there is nothing at the sides
    const probe: AimProbe = (x, y) =>
      y <= -40 && Math.abs(x) < 1 ? thing("enemy") : null;

    expect(findAimTarget({ x: 0, y: 0 }, -Math.PI / 2, probe)?.kind).toBe(
      "enemy"
    );
    expect(findAimTarget({ x: 0, y: 0 }, 0, probe)).toBeNull();
  });

  it("is hidden by a wall in front of it", () => {
    const probe: AimProbe = (x) =>
      x >= 50 ? thing("solid") : x >= 100 ? thing("enemy") : null;

    expect(findAimTarget({ x: 0, y: 0 }, 0, probe)?.kind).toBe("solid");
  });

  it("does not look farther than the range", () => {
    const probe = wallAt(100, "enemy");

    expect(findAimTarget({ x: 0, y: 0 }, 0, probe, 64)).toBeNull();
    expect(findAimTarget({ x: 0, y: 0 }, 0, probe, 128)?.kind).toBe("enemy");
  });

  it("does not skip a thing thinner than a tile", () => {
    const probe: AimProbe = (x) =>
      x >= 41 && x <= 44 ? thing("enemy") : null;

    expect(findAimTarget({ x: 0, y: 0 }, 0, probe)?.kind).toBe("enemy");
  });
});

describe("isInteractive", () => {
  it("is true for what a shot breaks or hurts, not for the walls", () => {
    expect(isInteractive(thing("breakable"))).toBe(true);
    expect(isInteractive(thing("enemy"))).toBe(true);
    expect(isInteractive(SOLID)).toBe(false);
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

  it("keeps what it points at, for the lock", () => {
    const targeting = new AimTargeting(wallAt(100, "enemy"), vi.fn());

    targeting.update(ray, 0);
    expect(targeting.target?.kind).toBe("enemy");

    targeting.update({ ...ray, angle: Math.PI }, 16);
    expect(targeting.target).toBeNull();
  });

  it("points at nothing when there is no aim", () => {
    const targeting = new AimTargeting(wallAt(100, "enemy"), vi.fn());
    targeting.update(ray, 0);

    targeting.update(null, 16);

    expect(targeting.isTargeting).toBe(false);
  });
});
