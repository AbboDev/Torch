import { TILE_SIZE } from "@/config/tiles";
import { MapObject } from "@/world/doors";

/**
 * The save points of a map, with no dependency on Phaser.
 *
 * A save point is either:
 * - an object of type "save_point" in the "objects" layer of Tiled. Its
 *   `name` is the id stored in the save, so it must be set and unique in the
 *   map. A rectangle is the area itself, and the Player restarts at its top
 *   center: draw it as tall as the Player (2 tiles) or more. A point works
 *   too: the area is 2 tiles wide and 4 tall around it, and the Player
 *   restarts exactly on it, like on the "spawn_point".
 * - the two barrel tiles of the chozodia tileset placed side by side (the
 *   plain one and the mossy one). The area is those tiles plus the tile
 *   above them, so a Player standing on the floor under them is inside.
 *
 * Standing in the area and pressing Up saves the game and fills life, ammo
 * and battery; the game restarts from there.
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

/** Tiled stores flips in the top 3 bits of a gid */
const GID_MASK = 0x1fffffff;

/** Local ids of the two barrel tiles in the chozodia tileset */
const BARREL_TILES = { left: 54, right: 70 };

const BARREL_TILESET = "chozodia";

/**
 * The hero sprite is 3 tiles tall and its origin is the top, so the sprite
 * is placed this many tiles above the floor it stands on
 */
const PLAYER_SPRITE_TILES = 3;

interface RawTileset {
  name?: string;
  firstgid?: number;
}

interface RawTileLayer {
  type?: string;
  width?: number;
  data?: readonly number[];
}

interface RawTileMap {
  tilesets?: readonly RawTileset[];
  layers?: readonly RawTileLayer[];
}

/**
 * The save points painted as the two barrel tiles side by side, in either
 * order. The id is `save_<column>_<row>` of the left tile, so a save can
 * find the same spot again.
 */
export function parseTileSavePoints(
  map: unknown,
  tileSize = TILE_SIZE
): SavePoint[] {
  const raw = (map ?? {}) as RawTileMap;
  const firstgid = raw.tilesets?.find(
    (tileset) => tileset.name === BARREL_TILESET
  )?.firstgid;

  if (typeof firstgid !== "number") {
    return [];
  }

  const left = firstgid + BARREL_TILES.left;
  const right = firstgid + BARREL_TILES.right;
  const points: SavePoint[] = [];
  const seen = new Set<string>();

  for (const layer of raw.layers ?? []) {
    if (layer.type !== "tilelayer" || !layer.data || !layer.width) {
      continue;
    }

    const { data, width } = layer;

    for (let index = 0; index < data.length - 1; index++) {
      // The tile on the right would be the first of the next row
      if (index % width === width - 1) {
        continue;
      }

      const a = data[index] & GID_MASK;
      const b = data[index + 1] & GID_MASK;
      const isPair = (a === left && b === right) || (a === right && b === left);

      if (!isPair) {
        continue;
      }

      const column = index % width;
      const row = Math.floor(index / width);
      const id = `save_${column}_${row}`;

      if (seen.has(id)) {
        continue;
      }

      seen.add(id);

      const x = column * tileSize;

      points.push({
        id,
        x,
        // One tile above the barrels: the standing Player's center is the
        // top edge of the barrels, and the top of the area is included
        y: (row - 1) * tileSize,
        width: tileSize * 2,
        height: tileSize * 2,
        spawn: {
          x: x + tileSize,
          y: (row + 1 - PLAYER_SPRITE_TILES) * tileSize,
        },
      });
    }
  }

  return points;
}
