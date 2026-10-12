import { AimInput, AimState, computeAim } from "@/entities/player/aim";
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
