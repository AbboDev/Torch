/**
 * What the Player is doing with its body. Exactly one at a time.
 */
export enum MovementState {
  /** Standing or running on the floor */
  GROUNDED = "grounded",
  /** Crouching on the floor */
  CROUCHING = "crouching",
  /** In the air: a jump, a fall, a launch... */
  AIRBORNE = "airborne",
  /** Hanging from the edge of a ledge */
  HANGING = "hanging",
  /** Holding a ladder */
  ON_LADDER = "on_ladder",
  /** Pulling itself up a ledge: the Player can't be controlled meanwhile */
  CLIMBING_LEDGE = "climbing_ledge",
}

/**
 * Where the Player has no gravity: it holds on to something, or is carried by
 * an animation. Anywhere else gravity pulls it.
 */
export function hasGravity(state: MovementState): boolean {
  return (
    state !== MovementState.HANGING &&
    state !== MovementState.ON_LADDER &&
    state !== MovementState.CLIMBING_LEDGE
  );
}
