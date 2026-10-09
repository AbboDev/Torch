/**
 * How the Player speeds up, turns and stops along the x axis, as pure
 * functions: no Phaser, so the feel can be tuned and tested.
 *
 * All the stop times are the time needed to stop from the top run speed
 * when no button is pressed. Arcade Physics applies a *linear* deceleration
 * (pixels per second squared), so a stop time `t` gives a deceleration of
 * `topSpeed / t`.
 *
 * Do not use Arcade's `useDamping` for this: with damping the drag is the
 * fraction of speed which is *kept after one second*, and a value like 0.9
 * means the Player keeps 90% of it: it slides for about 25 seconds.
 */

/** Seconds to stop on the floor: a short slide, as in Super Metroid */
export const GROUND_STOP_TIME = 0.08;

/** Seconds to stop in mid air: the Player keeps most of the momentum of a jump */
export const AIR_STOP_TIME = 0.4;

/** Seconds to stop while swimming: the liquid slows the Player down */
export const LIQUID_STOP_TIME = 0.25;

/**
 * The acceleration is multiplied by this while the Player pushes against the
 * direction it is moving, so that turning around is quick instead of a long
 * skid.
 */
export const TURN_ACCELERATION_MULTIPLIER = 3;

export interface HorizontalContext {
  isOnFloor: boolean;
  isSwimming: boolean;
}

/** Seconds to stop from the top speed with no button pressed */
export function getStopTime(context: HorizontalContext): number {
  if (context.isSwimming) {
    return LIQUID_STOP_TIME;
  }

  return context.isOnFloor ? GROUND_STOP_TIME : AIR_STOP_TIME;
}

/**
 * The drag to give to the body, in pixels per second squared
 *
 * @param topSpeed The top run speed of the Player
 */
export function getDeceleration(
  topSpeed: number,
  context: HorizontalContext
): number {
  return topSpeed / getStopTime(context);
}

/**
 * The acceleration to give to the body while a direction is pressed.
 *
 * @param direction    -1 for left, 1 for right
 * @param acceleration The normal acceleration of the Player
 * @param velocityX    The current x speed of the Player
 */
export function getAcceleration(
  direction: -1 | 1,
  acceleration: number,
  velocityX: number
): number {
  const isTurning = velocityX * direction < 0;

  return (
    direction * acceleration * (isTurning ? TURN_ACCELERATION_MULTIPLIER : 1)
  );
}
