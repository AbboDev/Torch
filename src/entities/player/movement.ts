/**
 * Speed rules of the Player, as pure functions of what the Player owns and
 * is doing: no Phaser, so they can be tested and tuned without running the game.
 */

/** Default multiplier of jump speed */
export const JUMP_SPEED_MULTIPLIER = 1.25;

/** Multiplier of jump speed offered by the wall jump power-up */
export const WALL_JUMP_SPEED_MULTIPLIER = 1.1;

/** Multiplier of jump speed offered by the high jump power-up */
export const HIGH_JUMP_SPEED_MULTIPLIER = 1.5;

/** Default multiplier of run speed */
export const RUN_SPEED_MULTIPLIER = 0.75;

/** Multiplier of dash speed offered by the dash power-up */
export const DASH_SPEED_MULTIPLIER = 2;

/** Multiplier of run speed offered by the boosted run power-up */
export const BOOSTED_RUN_SPEED_MULTIPLIER = 1.5;

/** Multiplier of swim x speed when the swim power-up is not active */
export const SWIM_X_SPEED_MULTIPLIER = 0.5;

/** Multiplier of swim y speed when the swim power-up is not active */
export const SWIM_Y_SPEED_MULTIPLIER = 1;

export interface MovementContext {
  isSwimming: boolean;
  /** The swim power-up is equipped */
  hasFan: boolean;
  /** The wall jump power-up is equipped */
  hasGlove: boolean;
  /** The double jump power-up is equipped */
  hasRocket: boolean;
  /** The high jump power-up is equipped */
  hasBoots: boolean;
  /** The boosted run power-up is equipped */
  hasBooster: boolean;
  canWallJump: boolean;
  canDoubleJump: boolean;
}

/** In a liquid without the swim power-up the movement is hindered */
const isHindered = (context: MovementContext): boolean =>
  context.isSwimming && !context.hasFan;

export function getJumpSpeedMultiplier(context: MovementContext): number {
  if (isHindered(context)) {
    return SWIM_Y_SPEED_MULTIPLIER;
  }

  if (context.hasGlove && context.canWallJump) {
    return WALL_JUMP_SPEED_MULTIPLIER;
  }

  if (context.hasRocket && context.canDoubleJump) {
    return JUMP_SPEED_MULTIPLIER;
  }

  if (context.hasBoots) {
    return HIGH_JUMP_SPEED_MULTIPLIER;
  }

  return JUMP_SPEED_MULTIPLIER;
}

export function getRunSpeedMultiplier(context: MovementContext): number {
  if (isHindered(context)) {
    return SWIM_X_SPEED_MULTIPLIER;
  }

  if (context.hasBooster) {
    return BOOSTED_RUN_SPEED_MULTIPLIER;
  }

  return RUN_SPEED_MULTIPLIER;
}

/** The acceleration applied while the Player is moving horizontally */
export function getRunSpeed(
  baseSpeed: number,
  context: MovementContext
): number {
  return isHindered(context)
    ? baseSpeed * SWIM_X_SPEED_MULTIPLIER
    : baseSpeed * 2;
}
