import { Point } from "@/entities/player/aimAngles";
import {
  AIM_PROBE_STEP,
  AIM_TARGET_RANGE,
  AimHit,
  AimProbe,
  findAimTarget,
  isInteractive,
} from "@/entities/player/aimTarget";

/** How long a wall in the way is borne before the lock breaks, in milliseconds */
export const LOCK_BREAK_DELAY = 150;

/** Where to aim while the lock holds */
export interface LockedAim {
  /** From the Player to the target, in radians */
  angle: number;
  /** Where the target is now */
  target: Point;
}

/**
 * The lock of the aim on one thing, a block or an enemy. The angle is worked
 * out again at every frame, so it follows the Player and the target when they
 * move. A wall (or any other thing) between them can not be locked through,
 * and breaks a lock after `LOCK_BREAK_DELAY`; the lock also ends when the
 * target is gone or too far.
 */
export class AimLock {
  private target: AimHit | null = null;

  /** Since when something has been in the way */
  private blockedSince: number | null = null;

  public get isLocked(): boolean {
    return this.target !== null;
  }

  /**
   * The lock button: lock on what the aim points at (nothing happens if it
   * points at nothing, or at a wall), or let go of what is locked.
   *
   * @param aimedAt What the aim points at: see `AimTargeting.target`
   */
  public toggle(aimedAt: AimHit | null): void {
    if (this.target) {
      this.release();
    } else if (isInteractive(aimedAt) && aimedAt.position?.()) {
      this.target = aimedAt;
      this.blockedSince = null;
    }
  }

  public release(): void {
    this.target = null;
    this.blockedSince = null;
  }

  /**
   * Call it every frame.
   *
   * @param from  Where the aim starts: the Player
   * @param probe Tells what there is in the way
   * @param time  The time of the game, in milliseconds
   * @return Where to aim, or null when there is no lock (or it just broke)
   */
  public update(from: Point, probe: AimProbe, time: number): LockedAim | null {
    const position = this.target?.position?.() ?? null;

    if (!this.target || !position) {
      this.release();

      return null;
    }

    const distance = Math.hypot(position.x - from.x, position.y - from.y);
    if (distance > AIM_TARGET_RANGE) {
      this.release();

      return null;
    }

    const angle = Math.atan2(position.y - from.y, position.x - from.x);

    // The first thing along the way must be the target itself
    const first = findAimTarget(
      from,
      angle,
      probe,
      distance + AIM_PROBE_STEP
    );
    const isBlocked = first !== null && first.id !== this.target.id;

    if (!isBlocked) {
      this.blockedSince = null;
    } else {
      this.blockedSince ??= time;

      if (time - this.blockedSince >= LOCK_BREAK_DELAY) {
        this.release();

        return null;
      }
    }

    return { angle, target: position };
  }
}
