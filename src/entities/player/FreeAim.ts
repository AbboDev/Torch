import type { AimDevice } from "@/input/bindings";
import {
  AIM_CURSOR_DISTANCE,
  AimCursorState,
  Point,
  angleBetween,
  pointOnCircle,
  stickAngle,
} from "@/entities/player/aimAngles";
import type { PlayerAim } from "@/entities/player/PlayerAim";
import { DirectionAxisX } from "@/miscellaneous/Direction";

/** What the free aim reads from the outside */
export interface FreeAimSources {
  /** The device which aims freely now, null when the buttons aim */
  device(): AimDevice | null;
  /** The center of the Player, in the world */
  origin(): Point;
  /** Where the mouse is, in the world */
  pointer(): Point;
  /** The right stick, from -1 to 1 */
  stick(): Point;
}

/**
 * Free aim: the mouse aims at the cursor, the right stick of the gamepad turns
 * a cursor around the Player, at a fixed distance. It tells the `PlayerAim`
 * the angle; with the stick it also moves `cursor`, which the CursorScene draws
 * (the mouse cursor is drawn where the mouse is).
 */
export class FreeAim {
  public constructor(
    private readonly sources: FreeAimSources,
    private readonly cursor: AimCursorState,
    private readonly distance = AIM_CURSOR_DISTANCE
  ) {}

  /** Call it every frame, after the movement has decided where the Player looks */
  public update(aim: PlayerAim): void {
    const device = this.sources.device();
    this.cursor.visible = false;

    if (!device) {
      aim.setFree(null);

      return;
    }

    const origin = this.sources.origin();
    // With nothing to aim at the Player aims ahead, where it is going
    const ahead = aim.facing.x === DirectionAxisX.LEFT ? Math.PI : 0;

    if (device === "mouse") {
      const target = this.sources.pointer();

      aim.setFree(angleBetween(origin, target, ahead), target);

      return;
    }

    const { x, y } = this.sources.stick();
    const angle = stickAngle(x, y) ?? ahead;

    aim.setFree(angle);

    if (aim.freeAngle !== null) {
      Object.assign(this.cursor, pointOnCircle(origin, angle, this.distance), {
        visible: true,
      });
    }
  }
}
