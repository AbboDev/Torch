import { TILE_SIZE } from "@/config/tiles";
import {
  DASH_SPEED_MULTIPLIER,
  HIGH_JUMP_SPEED_MULTIPLIER,
  MovementContext,
  getJumpSpeedMultiplier,
  getRunSpeed,
  getRunSpeedMultiplier,
} from "@/entities/player/movement";

/**
 * How fast the Player goes: the default speed, the one the other ones come
 * from, changed by what the Player owns and is doing (see movement.ts).
 */
export class PlayerSpeeds {
  /**
   * @param baseSpeed  The default speed, based on the gravity of the game
   * @param getContext What the Player owns and is doing now
   */
  public constructor(
    private readonly baseSpeed: number,
    private readonly getContext: () => MovementContext
  ) {}

  /** The y speed of a jump (negative: going up) */
  public getJumpSpeed(applyMultiplier = true): number {
    return (
      -this.baseSpeed *
      (applyMultiplier ? getJumpSpeedMultiplier(this.getContext()) : 1)
    );
  }

  public getMaxJumpSpeed(): number {
    return this.baseSpeed * HIGH_JUMP_SPEED_MULTIPLIER;
  }

  /** The acceleration while running */
  public getRunSpeed(): number {
    return getRunSpeed(this.baseSpeed, this.getContext());
  }

  /** The top x speed of a jump started standing */
  public getStandingRunSpeed(): number {
    return TILE_SIZE * 4;
  }

  public getLadderClimbSpeed(): number {
    return TILE_SIZE * 2.75;
  }

  public getDashSpeed(): number {
    return this.baseSpeed * DASH_SPEED_MULTIPLIER;
  }

  /** The top x speed while running */
  public getMaxRunSpeed(): number {
    return this.baseSpeed * getRunSpeedMultiplier(this.getContext());
  }
}
