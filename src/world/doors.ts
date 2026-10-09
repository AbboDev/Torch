import { RoomWithProperties, getRoomProperty } from "@/world/rooms";

/**
 * The doors of a map, with no dependency on Phaser.
 *
 * A door is an object of type "door" in the "objects" layer of Tiled: a
 * rectangle which takes the Player somewhere else in the map, whatever the
 * distance, even to a room which does not touch the current one. Its custom
 * properties:
 *
 * - `target` (type object, or a string with the name): the object where the
 *   Player appears, like the "spawn_point". Required. Pointing to the object
 *   by its id is better: names are not unique in a map.
 * - `requiresUp` (bool, default false): the Player must press Up while in the
 *   door, instead of just touching it.
 */

export interface MapObject extends RoomWithProperties {
  id: number;
  name?: string;
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface Door {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  target: { id: number; x: number; y: number };
  requiresUp: boolean;
}

/**
 * The doors in a list of objects. A door which can not work (no valid target,
 * no size) is left out, with a warning, so one mistake in Tiled does not
 * break the whole map.
 */
export function parseDoors(
  objects: readonly MapObject[],
  warn: (message: string) => void = console.warn
): Door[] {
  const doors: Door[] = [];

  for (const object of objects) {
    if (object.type !== "door") {
      continue;
    }

    const label = `Door ${object.id}${object.name ? ` "${object.name}"` : ""}`;
    const reference = getRoomProperty(object, "target");

    const target =
      typeof reference === "number"
        ? objects.find((candidate) => candidate.id === reference)
        : typeof reference === "string" && reference !== ""
          ? objects.find((candidate) => candidate.name === reference)
          : undefined;

    if (!target) {
      warn(`${label} has no valid "target": it is ignored`);
      continue;
    }

    if (target.id === object.id) {
      warn(`${label} has itself as "target": it is ignored`);
      continue;
    }

    if (!object.width || !object.height) {
      warn(`${label} has no size: it is ignored`);
      continue;
    }

    doors.push({
      id: object.id,
      x: object.x ?? 0,
      y: object.y ?? 0,
      width: object.width,
      height: object.height,
      target: { id: target.id, x: target.x ?? 0, y: target.y ?? 0 },
      requiresUp: getRoomProperty(object, "requiresUp") === true,
    });
  }

  return doors;
}

/** The first door containing the point (left and top included, right and bottom excluded) */
export function findDoorAt(
  doors: readonly Door[],
  x: number,
  y: number
): Door | null {
  return (
    doors.find(
      (door) =>
        x >= door.x &&
        x < door.x + door.width &&
        y >= door.y &&
        y < door.y + door.height
    ) ?? null
  );
}

/**
 * Decides when the Player uses a door.
 *
 * After using one the Player may appear inside another door (the one which
 * leads back): the doors do not work again until it has stepped out of every
 * door, or it would go back and forth forever.
 */
export class DoorTrigger {
  private armed = true;

  /**
   * Call it every frame
   *
   * @param inside    The door the Player is in, or null
   * @param upPressed The Up button is held down
   *
   * @return The door to use now, if any
   */
  public update(inside: Door | null, upPressed: boolean): Door | null {
    if (!inside) {
      this.armed = true;

      return null;
    }

    if (!this.armed || (inside.requiresUp && !upPressed)) {
      return null;
    }

    this.armed = false;

    return inside;
  }
}
