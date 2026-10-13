import type { AimDevice } from "@/input/bindings";
import {
  AIM_CURSOR_DISTANCE,
  AimCursorState,
  Point,
  angleBetween,
  elevationToAngle,
  pointOnCircle,
  poseElevation,
  stepElevation,
  stickAngle,
} from "@/entities/player/aimAngles";
import type { LockedAim } from "@/entities/player/aimLock";
import type { PlayerAim } from "@/entities/player/PlayerAim";
import { DirectionAxisX, DirectionAxisY } from "@/miscellaneous/Direction";

/** What the free aim reads from the outside */
export interface FreeAimSources {
  /** The device which aims now */
  device(): AimDevice;
  /** The center of the Player, in the world */
  origin(): Point;
  /** Where the mouse is, in the world */
  pointer(): Point;
  /** The right stick, from -1 to 1 */
  stick(): Point;
  /** The buttons which turn the aim of the keyboard */
  keys(): { fineAim: boolean; up: boolean; down: boolean };
}

/**
 * Free aim: the mouse aims at the cursor, the right stick of the gamepad turns
 * a cursor around the Player, at a fixed distance. With the keyboard only,
 * while the fine aim button is held up and down raise and lower the angle,
 * from where the buttons were aiming; let go of it and the buttons aim again,
 * in eight directions. It tells the `PlayerAim` the angle; with the stick and the
 * keyboard it also moves `cursor`, which the CursorScene draws (the mouse
 * cursor is drawn where the mouse is). A lock on a target (`AimLock`) takes
 * the aim over, whatever the device: the shots go from the gun to the target.
 */
export class FreeAim {
  /** The elevation of the aim of the keyboard; null with the fine aim button up */
  private elevation: number | null = null;

  public constructor(
    private readonly sources: FreeAimSources,
    private readonly cursor: AimCursorState,
    private readonly distance = AIM_CURSOR_DISTANCE
  ) {}

  /**
   * Call it every frame, after the movement has decided where the Player looks
   *
   * @param delta The time of the frame, in milliseconds
   * @param lock  Where the lock aims, while the aim is locked on a target
   */
  public update(
    aim: PlayerAim,
    delta = 0,
    lock: LockedAim | null = null
  ): void {
    const device = this.sources.device();
    this.cursor.visible = false;
    this.cursor.lock = null;
    aim.isAdjustingAngle = false;

    if (lock) {
      // Whatever the device was doing, from here on it starts again
      this.elevation = null;
      this.cursor.lock = lock.target;
      aim.setFree(lock.angle, lock.target);

      return;
    }

    const origin = this.sources.origin();
    // With nothing to aim at the Player aims ahead, where it is going
    const isLeft = aim.facing.x === DirectionAxisX.LEFT;
    const ahead = isLeft ? Math.PI : 0;

    if (device !== "keyboard") {
      this.elevation = null;
    }

    if (device === "mouse") {
      const target = this.sources.pointer();

      aim.setFree(angleBetween(origin, target, ahead), target);

      return;
    }

    let angle: number | null;

    if (device === "gamepad") {
      const { x, y } = this.sources.stick();

      angle = stickAngle(x, y) ?? ahead;
    } else {
      angle = this.getKeyboardAngle(aim, delta, isLeft);
      aim.isAdjustingAngle = angle !== null;
    }

    aim.setFree(angle);

    if (angle !== null && aim.freeAngle !== null) {
      Object.assign(this.cursor, pointOnCircle(origin, angle, this.distance), {
        visible: true,
      });
    }
  }

  /** The angle of the keyboard, or null while the fine aim button is up */
  private getKeyboardAngle(
    aim: PlayerAim,
    delta: number,
    isLeft: boolean
  ): number | null {
    const { fineAim, up, down } = this.sources.keys();

    if (!fineAim) {
      this.elevation = null;

      return null;
    }

    // It starts where the buttons were aiming: the angle does not jump
    this.elevation ??= poseElevation(
      aim.facingForAim.y ?? DirectionAxisY.MIDDLE,
      aim.isAimingDiagonal
    );
    this.elevation = stepElevation(
      this.elevation,
      Number(up) - Number(down),
      delta
    );

    return elevationToAngle(this.elevation, isLeft);
  }
}
