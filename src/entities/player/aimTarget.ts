import { TILE_SIZE } from "@/config/tiles";
import { Point } from "@/entities/player/aimAngles";

/** What a point of the world is, for the aim */
export type AimHit = "solid" | "breakable" | "enemy";

/** Tells what there is at a point of the world, if anything */
export type AimProbe = (x: number, y: number) => AimHit | null;

/** How far the aim looks for something, in pixels of the world */
export const AIM_TARGET_RANGE = TILE_SIZE * 12;

/** The distance between two points looked at along the aim: less than a tile */
export const AIM_PROBE_STEP = 4;

/**
 * The first thing along the aim, from `from` up to `range`: the walls hide
 * what is behind them, so it can be a wall too.
 */
export function findAimTarget(
  from: Point,
  angle: number,
  probe: AimProbe,
  range = AIM_TARGET_RANGE,
  step = AIM_PROBE_STEP
): AimHit | null {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  for (let distance = 0; distance <= range; distance += step) {
    const hit = probe(from.x + dx * distance, from.y + dy * distance);

    if (hit) {
      return hit;
    }
  }

  return null;
}

/** Shooting it does something: a block which breaks or an enemy */
export function isInteractive(hit: AimHit | null): boolean {
  return hit === "breakable" || hit === "enemy";
}

/** Where the gun is and where it points */
export interface AimRay {
  from: Point;
  angle: number;
}

/**
 * Tells if the aim points at something which can be hit, and calls
 * `onAcquire` at the moment it starts to (not again if the aim shivers on the
 * edge of it: see `cooldown`).
 */
export class AimTargeting {
  /** The aim points at something which can be hit now */
  public isTargeting = false;

  private lastAcquired = -Infinity;

  public constructor(
    private readonly probe: AimProbe,
    private readonly onAcquire: () => void,
    private readonly cooldown = 300
  ) {}

  /**
   * @param ray  The aim, or null if the Player is not aiming (or has no weapon)
   * @param time The time of the game, in milliseconds
   */
  public update(ray: AimRay | null, time: number): void {
    const hit = ray ? findAimTarget(ray.from, ray.angle, this.probe) : null;
    const isTargeting = isInteractive(hit);

    if (
      isTargeting &&
      !this.isTargeting &&
      time - this.lastAcquired >= this.cooldown
    ) {
      this.lastAcquired = time;
      this.onAcquire();
    }

    this.isTargeting = isTargeting;
  }
}
