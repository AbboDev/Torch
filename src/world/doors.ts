import { RoomWithProperties, getRoomProperty } from "@/world/rooms";
import { DOOR_SCHEMA, parseProperties } from "@/world/objectSchemas";
import { getObjectClass } from "@/world/tiledObjects";

/**
 * The doors of a map, with no dependency on Phaser.
 *
 * A door is an object of class "door" in the "objects" layer of Tiled: a
 * rectangle which takes the Player somewhere else in the map, whatever the
 * distance, even to a room which does not touch the current one. Its custom
 * properties:
 *
 * - `target` (type object, or a string with the name): the object where the
 *   Player appears, like the "spawn_point". Required. Pointing to the object
 *   by its id is better: names are not unique in a map.
 * - `targetMap` (string, default none): the name of another map, when the
 *   target is there: `target` is then the id or the name of an object of that
 *   map. Changing map is not done by the game yet.
 * - `requiresUp` (bool, default false): the Player must press Up while in the
 *   door, instead of just touching it.
 */

export interface MapObject extends RoomWithProperties {
  id: number;
  name?: string;
  type?: string;
  class?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/** Where a door leads, in the same map: the position of the target object */
export interface LocalTarget {
  map: null;
  id: number;
  x: number;
  y: number;
}

/** Where a door leads, in another map: that map and the object in it */
export interface RemoteTarget {
  map: string;
  /** The object of the other map, by its id or by its name */
  target: number | string;
}

export type DoorTarget = LocalTarget | RemoteTarget;

export interface Door<Target extends DoorTarget = DoorTarget> {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  target: Target;
  requiresUp: boolean;
}

/** A door which leads somewhere in the map it is in */
export type LocalDoor = Door<LocalTarget>;

export function isLocalDoor(door: Door): door is LocalDoor {
  return door.target.map === null;
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
    if (getObjectClass(object) !== "door") {
      continue;
    }

    const label = `Door ${object.id}${object.name ? ` "${object.name}"` : ""}`;
    const { values, problems, isBroken } = parseProperties(DOOR_SCHEMA, object);

    // Said once: what makes the door useless, or else what is only wrong
    const useless = (reason: string) =>
      warn(`${label} ${reason}: it is ignored`);

    if (isBroken) {
      useless(`has no valid "target" (${problems.join("; ")})`);
      continue;
    }

    const reference = values.target as number | string;
    const targetMap = String(values.targetMap ?? "").trim();

    let target: DoorTarget | undefined;

    if (targetMap !== "") {
      // The other map is not loaded: only its name and the reference can be known
      target = { map: targetMap, target: reference };
    } else {
      const found =
        typeof reference === "number"
          ? objects.find((candidate) => candidate.id === reference)
          : reference !== ""
            ? objects.find((candidate) => candidate.name === reference)
            : undefined;

      if (found && found.id === object.id) {
        useless(`has itself as "target"`);
        continue;
      }

      if (found) {
        target = { map: null, id: found.id, x: found.x ?? 0, y: found.y ?? 0 };
      }
    }

    if (!target) {
      useless(`has no valid "target"`);
      continue;
    }

    if (!object.width || !object.height) {
      useless("has no size");
      continue;
    }

    for (const problem of problems) {
      warn(`${label}: ${problem}`);
    }

    doors.push({
      id: object.id,
      x: object.x ?? 0,
      y: object.y ?? 0,
      width: object.width,
      height: object.height,
      target,
      requiresUp: values.requiresUp === true,
    });
  }

  return doors;
}

/** The first door containing the point (left and top included, right and bottom excluded) */
export function findDoorAt<Kind extends Door>(
  doors: readonly Kind[],
  x: number,
  y: number
): Kind | null {
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
export class DoorTrigger<Kind extends Door = Door> {
  private armed = true;

  /**
   * Call it every frame
   *
   * @param inside    The door the Player is in, or null
   * @param upPressed The Up button is held down
   *
   * @return The door to use now, if any
   */
  public update(inside: Kind | null, upPressed: boolean): Kind | null {
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
