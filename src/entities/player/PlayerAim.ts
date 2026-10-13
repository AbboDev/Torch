import { AimInput, AimState, computeAim } from "@/entities/player/aim";
import { Point, Side, aimPose } from "@/entities/player/aimAngles";
import {
  DirectionAxisX,
  DirectionAxisY,
  Facing,
} from "@/miscellaneous/Direction";

const front = (): Facing => ({
  y: DirectionAxisY.MIDDLE,
  x: DirectionAxisX.CENTER,
});

/**
 * Where the Player looks and where it aims. The movement turns it to the side
 * it walks to; the buttons of the aim tilt it up, down or diagonally.
 */
export class PlayerAim {
  /** Where the Player is looking */
  public readonly facing: Facing = front();

  /** Where the Player is aiming */
  public readonly facingForAim: Facing = front();

  /** Where the Player was looking in the previous frame */
  public previousFacing: Facing = front();

  /** The Player is aiming diagonally */
  public isAimingDiagonal = false;

  /** The Player was aiming diagonally in the previous frame */
  public wasAimingDiagonal = false;

  /** The exact angle of the aim, in radians; null: aiming with the buttons */
  public freeAngle: number | null = null;

  /** The point of the world the mouse is on (null aiming with the stick) */
  public freeTarget: Point | null = null;

  /**
   * The aim key is down and the keyboard turns the aim: it counts as aiming
   * diagonally for the movement, so the down button does not crouch
   */
  public isAdjustingAngle = false;

  /** The side the sprite looks at while aiming freely */
  public freeSide: Side | null = null;

  /**
   * The side the sprite is drawn looking at. The movement keeps its own
   * `facing` (dash, ledges): aiming to one side while running to the other
   * only turns the sprite.
   */
  public get lookingX(): Facing["x"] {
    return this.freeSide ?? this.facing.x;
  }

  /**
   * Aim at an angle instead of the buttons: the sprite and the shots take it.
   * The sprites have eight directions, the shots (see `freeAngle`) any angle.
   * Until the Player has looked to a side (it starts looking at the front) the
   * buttons keep the aim, as before.
   *
   * @param angle  The angle, or null to go back to the buttons
   * @param target The point of the world aimed at, if there is one
   */
  public setFree(angle: number | null, target: Point | null = null): void {
    if (angle === null || this.facing.x === DirectionAxisX.CENTER) {
      this.freeAngle = null;
      this.freeTarget = null;
      this.freeSide = null;

      return;
    }

    const pose = aimPose(
      angle,
      this.freeSide ??
        (this.facingForAim.x === DirectionAxisX.LEFT
          ? DirectionAxisX.LEFT
          : DirectionAxisX.RIGHT)
    );

    this.freeAngle = angle;
    this.freeTarget = target;
    this.freeSide = pose.side;
    this.facing.y = pose.facingY;
    this.facingForAim.x = pose.side;
    this.facingForAim.y = pose.facingY;
    this.isAimingDiagonal = pose.diagonal;
  }

  /** Call it at the start of every frame */
  public remember(): void {
    this.previousFacing = { ...this.facing };
  }

  /**
   * Tilt the aim for the buttons held now
   *
   * @param input     The buttons of the aim and of the directions
   * @param velocityY The vertical speed: standing still, down means crouch
   */
  public update(input: AimInput, velocityY: number): void {
    const current: AimState = {
      facingY: this.facing.y as DirectionAxisY,
      facingForAimY: this.facingForAim.y as DirectionAxisY,
      isAimingDiagonal: this.isAimingDiagonal,
      wasAimingDiagonal: this.wasAimingDiagonal,
    };

    const aim = computeAim(input, current, velocityY);

    this.facing.y = aim.facingY;
    this.facingForAim.y = aim.facingForAimY;
    this.isAimingDiagonal = aim.isAimingDiagonal;
    this.wasAimingDiagonal = aim.wasAimingDiagonal;
  }
}
