import { TILE_SIZE } from "@/config/tiles";
import { MapObject } from "@/world/doors";

/**
 * The save points of a map, with no dependency on Phaser.
 *
 * A save point is an object of type "save_point" in the "objects" layer of
 * Tiled. Its `name` is the id stored in the save, so it must be set and
 * unique in the map. Standing in its area and pressing Up saves the game and
 * fills life, ammo and battery; the game restarts from there.
 *
 * - A rectangle is the area itself, and the Player restarts at its top
 *   center: draw it as tall as the Player (2 tiles) or more.
 * - A point works too: the area is 2 tiles wide and 4 tall around it, and the
 *   Player restarts exactly on it, like on the "spawn_point".
 */

export interface SavePoint {
  id: string;
  /** The area where the Player can save */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Where the Player appears when the game restarts here */
  spawn: { x: number; y: number };
}

/** The area around a save point which is only a point in Tiled */
const POINT_AREA = {
  halfWidth: TILE_SIZE,
  above: TILE_SIZE,
  below: TILE_SIZE * 3,
};

/**
 * The save points in a list of objects. One without a name, or with the name
 * of another, is left out with a warning: the save could not tell them apart.
 */
export function parseSavePoints(
  objects: readonly MapObject[],
  warn: (message: string) => void = console.warn
): SavePoint[] {
  const points: SavePoint[] = [];

  for (const object of objects) {
    if (object.type !== "save_point") {
      continue;
    }

    const x = object.x ?? 0;
    const y = object.y ?? 0;

    if (!object.name) {
      warn(`Save point ${object.id} has no name: it is ignored`);
      continue;
    }

    if (points.some((point) => point.id === object.name)) {
      warn(`Save point "${object.name}" is repeated: only the first is used`);
      continue;
    }

    if (object.width && object.height) {
      points.push({
        id: object.name,
        x,
        y,
        width: object.width,
        height: object.height,
        spawn: { x: x + object.width / 2, y },
      });
    } else {
      points.push({
        id: object.name,
        x: x - POINT_AREA.halfWidth,
        y: y - POINT_AREA.above,
        width: POINT_AREA.halfWidth * 2,
        height: POINT_AREA.above + POINT_AREA.below,
        spawn: { x, y },
      });
    }
  }

  return points;
}

export function findSavePoint(
  points: readonly SavePoint[],
  id: string
): SavePoint | undefined {
  return points.find((point) => point.id === id);
}

/** The save point whose area contains the point (left and top included, right and bottom excluded) */
export function findSavePointAt(
  points: readonly SavePoint[],
  x: number,
  y: number
): SavePoint | null {
  return (
    points.find(
      (point) =>
        x >= point.x &&
        x < point.x + point.width &&
        y >= point.y &&
        y < point.y + point.height
    ) ?? null
  );
}

/**
 * Decides when the Player saves: when Up is pressed inside the area, not just
 * held. Holding Up while walking in does nothing, so aiming up never saves.
 */
export class SavePointTrigger {
  private wasUp = false;

  /**
   * Call it every frame
   *
   * @param inside    The save point the Player is in, or null
   * @param upPressed The Up button is held down
   * @param canSave   The Player can save now (standing on the floor, in control)
   *
   * @return The save point to use now, if any
   */
  public update(
    inside: SavePoint | null,
    upPressed: boolean,
    canSave: boolean
  ): SavePoint | null {
    const justPressed = upPressed && !this.wasUp;
    this.wasUp = upPressed;

    return inside && canSave && justPressed ? inside : null;
  }
}
