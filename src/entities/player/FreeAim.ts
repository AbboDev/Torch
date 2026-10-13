import type { AimDevice } from "@/input/bindings";
import {
  AIM_CURSOR_DISTANCE,
  AimCursorState,
  KEYBOARD_AIM_START,
  Point,
  angleBetween,
  elevationToAngle,
  pointOnCircle,
  stepElevation,
  stickAngle,
} from "@/entities/player/aimAngles";
import type { PlayerAim } from "@/entities/player/PlayerAim";
import { DirectionAxisX } from "@/miscellaneous/Direction";

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
  /** The buttons which aim with the keyboard */
  keys(): { aim: boolean; up: boolean; down: boolean };
}

/**
 * Free aim: the mouse aims at the cursor, the right stick of the gamepad turns
 * a cursor around the Player, at a fixed distance. With the keyboard only, the
 * aim key starts the diagonal aim and up and down raise and lower the angle
 * while it is held; let go of it and the buttons aim again, in eight
 * directions. It tells the `PlayerAim` the angle; with the stick and the
 * keyboard it also moves `cursor`, which the CursorScene draws (the mouse
 * cursor is drawn where the mouse is).
 */
export class FreeAim {
  /** The elevation of the aim of the keyboard; null with the aim key up */
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
   */
  public update(aim: PlayerAim, delta = 0): void {
    const device = this.sources.device();
    this.cursor.visible = false;
    aim.isAdjustingAngle = false;

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
      angle = this.getKeyboardAngle(delta, isLeft);
      aim.isAdjustingAngle = angle !== null;
    }

    aim.setFree(angle);

    if (angle !== null && aim.freeAngle !== null) {
      Object.assign(this.cursor, pointOnCircle(origin, angle, this.distance), {
        visible: true,
      });
    }
  }

  /** The angle of the keyboard, or null while the aim key is up */
  private getKeyboardAngle(delta: number, isLeft: boolean): number | null {
    const { aim, up, down } = this.sources.keys();

    if (!aim) {
      this.elevation = null;

      return null;
    }

    // Pressing the aim key together with down starts below, as it always did
    this.elevation ??= down && !up ? -KEYBOARD_AIM_START : KEYBOARD_AIM_START;
    this.elevation = stepElevation(
      this.elevation,
      Number(up) - Number(down),
      delta
    );

    return elevationToAngle(this.elevation, isLeft);
  }
}
