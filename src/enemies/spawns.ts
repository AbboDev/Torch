import { EnemyKind, isEnemyKind } from "@/config/enemies";
import {
  DOWN,
  LEFT,
  RIGHT,
  Step,
  UP,
  arePerpendicular,
  getDefaultHeading,
} from "@/enemies/crawl";
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
 * - `direction` (string, "left", "right", "up" or "down"): where it goes
 *   first. It is "left" if it is not given, or "up" for an enemy which clings
 *   to a wall;
 * - `surface` (string, "down", "left", "right" or "up"): the side of the enemy
 *   where the floor, the wall or the ceiling it clings to is, "down" if it is
 *   not given. Only for the enemies which crawl on walls and ceilings, and it
 *   must be at right angles with `direction`.
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
  /** Which way along the floor: -1 is left, 1 is right (for the walkers) */
  heading: Heading;
  /** The side where what it clings to is (for the enemies which crawl) */
  surface: Step;
  /** Which way it goes first, along its surface (for the enemies which crawl) */
  direction: Step;
}

const DIRECTIONS: Record<string, Step> = {
  left: LEFT,
  right: RIGHT,
  up: UP,
  down: DOWN,
};

/** A direction named in Tiled, or undefined if there is no such direction */
function readStep(value: unknown): Step | undefined {
  return typeof value === "string" && Object.hasOwn(DIRECTIONS, value)
    ? DIRECTIONS[value]
    : undefined;
}

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

    const surfaceName = getRoomProperty(object, "surface");
    let surface = DOWN;

    if (surfaceName !== undefined) {
      const given = readStep(surfaceName);

      if (given === undefined) {
        console.warn(
          `Enemy ${object.id}: unknown surface "${String(surfaceName)}": it is "down"`
        );
      } else {
        surface = given;
      }
    }

    const directionName = getRoomProperty(object, "direction");
    let direction = getDefaultHeading(surface);

    if (directionName !== undefined) {
      const given = readStep(directionName);

      if (given === undefined) {
        console.warn(
          `Enemy ${object.id}: unknown direction "${String(directionName)}": it goes ${
            direction === LEFT ? "left" : "up"
          }`
        );
      } else if (!arePerpendicular(given, surface)) {
        console.warn(
          `Enemy ${object.id}: direction "${String(directionName)}" is not along its surface: it goes the other way`
        );
      } else {
        direction = given;
      }
    }

    spawns.push({
      id: `enemy_${object.id}`,
      kind,
      x: (object.x ?? 0) + (object.width ?? 0) / 2,
      y: (object.y ?? 0) + (object.height ?? 0),
      // a walker goes along the floor: only left and right mean something to it
      heading: direction.x === 1 ? 1 : -1,
      surface,
      direction,
    });
  }

  return spawns;
}
