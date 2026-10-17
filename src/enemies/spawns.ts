import { EnemyKind, isEnemyKind } from "@/config/enemies";
import type { Heading } from "@/enemies/patrol";
import type { MapObject } from "@/world/doors";
import { getRoomProperty } from "@/world/rooms";

/**
 * Where the enemies of a map are, with no dependency on Phaser. In Tiled an
 * enemy is an object of type `enemy` in the layer `scenario_elements`, with
 * the custom properties:
 *
 * - `kind` (string): one of the keys of `ENEMY_DEFINITIONS`, "walker" if it is
 *   not given;
 * - `direction` (string, "left" or "right"): where it goes first, "left" if it
 *   is not given.
 *
 * The enemy stands with its feet at the bottom of the object and its middle at
 * the middle of it, so a rectangle drawn on the floor puts it on the floor.
 */
export interface EnemySpawn {
  /** Tells it from the others: "enemy_12", from the id of the object */
  id: string;
  kind: EnemyKind;
  /** The middle of the feet, in pixels of the world */
  x: number;
  y: number;
  heading: Heading;
}

const DIRECTIONS: Record<string, Heading> = { left: -1, right: 1 };

export function parseEnemySpawns(
  objects: readonly (MapObject & { width?: number; height?: number })[]
): EnemySpawn[] {
  const spawns: EnemySpawn[] = [];

  for (const object of objects) {
    if (object.type !== "enemy") {
      continue;
    }

    const kind = getRoomProperty(object, "kind") ?? "walker";

    if (!isEnemyKind(kind)) {
      console.warn(
        `Enemy ${object.id}: unknown kind "${String(kind)}": left out`
      );
      continue;
    }

    const direction = getRoomProperty(object, "direction");
    let heading: Heading = -1;

    if (direction !== undefined) {
      const given = typeof direction === "string" ? DIRECTIONS[direction] : undefined;

      if (given === undefined) {
        console.warn(
          `Enemy ${object.id}: unknown direction "${String(direction)}": it goes left`
        );
      } else {
        heading = given;
      }
    }

    spawns.push({
      id: `enemy_${object.id}`,
      kind,
      x: (object.x ?? 0) + (object.width ?? 0) / 2,
      y: (object.y ?? 0) + (object.height ?? 0),
      heading,
    });
  }

  return spawns;
}
