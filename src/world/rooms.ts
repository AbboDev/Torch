/**
 * Which room of the map a point belongs to, with no dependency on Phaser.
 *
 * A room is a rectangle in the map (an object of type "room" in Tiled).
 * Rooms usually share their borders, so the rectangles are half open:
 * the left and top borders belong to the room, the right and bottom ones to
 * the next room. A point on a shared border is therefore in exactly one room.
 */

export interface RoomBounds {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface RoomWithId extends RoomBounds {
  id: number;
}

/** Is the point inside the room? (left and top included, right and bottom excluded) */
export function roomContains(room: RoomBounds, x: number, y: number): boolean {
  const left = room.x ?? 0;
  const top = room.y ?? 0;

  return (
    x >= left &&
    x < left + (room.width ?? 0) &&
    y >= top &&
    y < top + (room.height ?? 0)
  );
}

/** The distance between a point and the closest point of the room */
function distanceToRoom(room: RoomBounds, x: number, y: number): number {
  const left = room.x ?? 0;
  const top = room.y ?? 0;
  const right = left + (room.width ?? 0);
  const bottom = top + (room.height ?? 0);

  const dx = Math.max(left - x, 0, x - right);
  const dy = Math.max(top - y, 0, y - bottom);

  return Math.hypot(dx, dy);
}

/**
 * The index of the room containing the point, or null.
 *
 * @param rooms   The rooms of the map
 * @param current The room the Player is in now: if rooms overlap, the Player
 *                stays in the current one instead of flickering between them
 */
export function findRoomIndex(
  rooms: readonly RoomBounds[],
  x: number,
  y: number,
  current?: number | null
): number | null {
  if (
    typeof current === "number" &&
    rooms[current] &&
    roomContains(rooms[current], x, y)
  ) {
    return current;
  }

  const index = rooms.findIndex((room) => roomContains(room, x, y));

  return index === -1 ? null : index;
}

export interface ResolvedRoom {
  /** The room, or null if the map has no rooms */
  index: number | null;
  /** The point is not in any room: `index` is the closest one */
  outside: boolean;
}

/**
 * Like `findRoomIndex`, but never gives up: a point outside every room
 * (a gap in the map, a Player pushed out of the world) belongs to the
 * closest room, so the game keeps working instead of crashing.
 */
export function resolveRoom(
  rooms: readonly RoomBounds[],
  x: number,
  y: number,
  current?: number | null
): ResolvedRoom {
  const inside = findRoomIndex(rooms, x, y, current);
  if (inside !== null) {
    return { index: inside, outside: false };
  }

  let closest: number | null = null;
  let closestDistance = Infinity;

  rooms.forEach((room, index) => {
    const distance = distanceToRoom(room, x, y);

    if (distance < closestDistance) {
      closest = index;
      closestDistance = distance;
    }
  });

  return { index: closest, outside: true };
}

/**
 * A stable id of a room to store in a save.
 *
 * The id Tiled gives to the object is unique (names are not: a map can have
 * several rooms called "room_bottom") and it does not change when the room
 * is renamed or moved.
 */
export function getRoomId(room: { id: number }): string {
  return `room_${room.id}`;
}
