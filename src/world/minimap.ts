import type { MapObject } from "@/world/doors";
import { RoomBounds, getRoomProperty } from "@/world/rooms";

/**
 * The data of a minimap, with no dependency on Phaser. It is made from the
 * map the game already has, so it is always the same as the map in Tiled:
 *
 * - the terrain comes from the tile layers (a wall is a wall, water is water);
 * - the borders come from the rooms (objects of type "room");
 * - the points of interest come from objects: the "save_point" and the "door"
 *   ones count by themselves, and any other is an object of type "poi" whose
 *   custom property `kind` is one of `POI_KINDS` ("save", "door", "item",
 *   "boss" or "other", which is the default).
 *
 * It is made of cells, one for every tile of the map.
 */
export const Terrain = {
  EMPTY: 0,
  SOLID: 1,
  LIQUID: 2,
  /** A platform or a stair: it can be walked on, but not always crossed */
  PLATFORM: 3,
} as const;

export type TerrainType = (typeof Terrain)[keyof typeof Terrain];

export const POI_KINDS = ["save", "door", "item", "boss", "other"] as const;

export type PoiKind = (typeof POI_KINDS)[number];

export interface MinimapPoi {
  /** Tells it from the others, e.g. "save_point_12" */
  id: string;
  kind: PoiKind;
  col: number;
  row: number;
}

export interface MinimapMap {
  cols: number;
  rows: number;
  /** The size of a tile in the world, in pixels */
  tileSize: number;
  /** The terrain of every cell, row after row (see `Terrain`) */
  terrain: Uint8Array;
  /** 1 for the cells inside a room: only these are ever drawn */
  inRoom: Uint8Array;
  /** 1 for the cells on the border of their room */
  edge: Uint8Array;
  pois: MinimapPoi[];
}

export interface MinimapSource {
  cols: number;
  rows: number;
  tileSize: number;
  /** Is there a tile in the layer, at this cell? */
  isFilled(layer: string, col: number, row: number): boolean;
  rooms: readonly RoomBounds[];
  objects: readonly MapObject[];
}

/** The layers which make a wall, from the strongest to the weakest */
const SOLID_LAYERS = ["collision", "breakables"];
const PLATFORM_LAYERS = ["stairs", "platforms"];
const LIQUID_LAYERS = ["liquids"];

const POI_OBJECT_KINDS: Record<string, PoiKind> = {
  save_point: "save",
  door: "door",
};

const anyFilled = (
  source: MinimapSource,
  layers: readonly string[],
  col: number,
  row: number
): boolean => layers.some((layer) => source.isFilled(layer, col, row));

function getTerrain(
  source: MinimapSource,
  col: number,
  row: number
): TerrainType {
  if (anyFilled(source, SOLID_LAYERS, col, row)) {
    return Terrain.SOLID;
  }

  if (anyFilled(source, PLATFORM_LAYERS, col, row)) {
    return Terrain.PLATFORM;
  }

  return anyFilled(source, LIQUID_LAYERS, col, row)
    ? Terrain.LIQUID
    : Terrain.EMPTY;
}

/** The kind of a point of interest of the map, or null if the object is not one */
function getPoiKind(object: MapObject): PoiKind | null {
  const byType = object.type ? POI_OBJECT_KINDS[object.type] : undefined;
  if (byType) {
    return byType;
  }

  if (object.type !== "poi") {
    return null;
  }

  const kind = getRoomProperty(object, "kind");
  if (kind === undefined) {
    return "other";
  }

  if (POI_KINDS.includes(kind as PoiKind)) {
    return kind as PoiKind;
  }

  console.warn(`Point of interest ${object.id}: unknown kind "${kind}"`);

  return "other";
}

export function buildMinimapMap(source: MinimapSource): MinimapMap {
  const { cols, rows, tileSize } = source;
  const terrain = new Uint8Array(cols * rows);
  const inRoom = new Uint8Array(cols * rows);
  const edge = new Uint8Array(cols * rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      terrain[row * cols + col] = getTerrain(source, col, row);
    }
  }

  for (const room of source.rooms) {
    // The rooms share their borders, and rows and columns are whole tiles
    const left = Math.max(0, Math.floor((room.x ?? 0) / tileSize));
    const top = Math.max(0, Math.floor((room.y ?? 0) / tileSize));
    const right = Math.min(
      cols,
      Math.ceil(((room.x ?? 0) + (room.width ?? 0)) / tileSize)
    );
    const bottom = Math.min(
      rows,
      Math.ceil(((room.y ?? 0) + (room.height ?? 0)) / tileSize)
    );

    for (let row = top; row < bottom; row++) {
      for (let col = left; col < right; col++) {
        inRoom[row * cols + col] = 1;

        if (col === left || col === right - 1 || row === top || row === bottom - 1) {
          edge[row * cols + col] = 1;
        }
      }
    }
  }

  const pois: MinimapPoi[] = [];

  for (const object of source.objects) {
    const kind = getPoiKind(object);
    if (!kind) {
      continue;
    }

    // The middle of the object, as a door is a rectangle and a point has no size
    const col = Math.floor(
      ((object.x ?? 0) + (object.width ?? 0) / 2) / tileSize
    );
    const row = Math.floor(
      ((object.y ?? 0) + (object.height ?? 0) / 2) / tileSize
    );

    if (col < 0 || col >= cols || row < 0 || row >= rows) {
      console.warn(`Point of interest ${object.id} is outside the map: left out`);
      continue;
    }

    pois.push({ id: `${object.type}_${object.id}`, kind, col, row });
  }

  return { cols, rows, tileSize, terrain, inRoom, edge, pois };
}
