export interface RoomTracking {
  /** The room the Player is in */
  current: number;
  /** The room it was in before the last change, if there was one */
  previous: number | null;
  /** The Player went into another room in this frame */
  changed: boolean;
}

/**
 * Follow the room of the Player from one frame to the next.
 *
 * @param current  The room the Player was in
 * @param previous The room it was in before
 * @param found    The room it is in now, or null if there is none
 */
export function trackRoom(
  current: number,
  previous: number | null,
  found: number | null
): RoomTracking {
  if (found !== null && found !== current) {
    return { current: found, previous: current, changed: true };
  }

  return { current, previous, changed: false };
}
