import type { RoomBounds } from "@/world/rooms";

/**
 * Numbers of the scroll between two rooms, with no dependency on Phaser
 */

/** How fast the camera scrolls to the next room, in pixels per millisecond */
export const SCROLL_SPEED = 0.6;

/** Even a short scroll takes this long, in milliseconds, to be seen */
export const MIN_SCROLL_DURATION = 350;

/** Even a long scroll takes at most this long, in milliseconds */
export const MAX_SCROLL_DURATION = 900;

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The rectangle of a room, with 0 for what Tiled did not give */
export function toBounds(room: RoomBounds): Bounds {
  return {
    x: room.x ?? 0,
    y: room.y ?? 0,
    width: room.width ?? 0,
    height: room.height ?? 0,
  };
}

/**
 * The smallest rectangle containing both rooms: while the camera scrolls
 * from one to the other it must be free to be anywhere in it
 */
export function unionBounds(a: Bounds, b: Bounds): Bounds {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);

  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/** How long to scroll a distance (pixels), in milliseconds */
export function getScrollDuration(distance: number): number {
  return Math.min(
    MAX_SCROLL_DURATION,
    Math.max(MIN_SCROLL_DURATION, distance / SCROLL_SPEED)
  );
}
