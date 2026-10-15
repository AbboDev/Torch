import type { MapObject } from "@/world/doors";
import {
  RoomBounds,
  RoomWithProperties,
  getRoomProperty,
} from "@/world/rooms";

/**
 * The data of a minimap, with no dependency on Phaser. It is made from the
 * map the game already has, so it is always the same as the map in Tiled:
 *
 * - the terrain comes from the tile layers (a wall is a wall, water is water);
 * - the borders and the flags come from the rooms (objects of type "room"):
 *   `dark` (as in the game), and `hot` or `toxic` (bool), which can not be set
 *   together: the minimap colors the room for them;
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

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What a room can be, besides dark: the two can not be together */
export const Hazard = {
  NONE: 0,
  /** High temperature */
  HOT: 1,
  /** Toxic air */
  TOXIC: 2,
} as const;

export type HazardType = (typeof Hazard)[keyof typeof Hazard];

/** The flags of a room which the minimap shows */
export interface MinimapRoom {
  /** The room is dark: only what the torch lights is seen */
  dark: boolean;
  hazard: HazardType;
}

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
  /** The room of every cell (an index of `rooms`), or -1 outside of them: only these are drawn */
  roomOf: Int16Array;
  /** The flags of the rooms, in the order of the rooms of the map */
  rooms: MinimapRoom[];
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
  rooms: ReadonlyArray<RoomBounds & RoomWithProperties & { id?: number }>;
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

/**
 * The flags of a room, as set in Tiled: `dark` is a string (the color of the
 * dark) as the game reads it, `hot` and `toxic` are bool. A room which has both
 * is wrong: it is `hot`, and a warning says so.
 */
export function getRoomFlags(
  room: RoomWithProperties & { id?: number }
): MinimapRoom {
  const darkness = getRoomProperty(room, "dark");
  const isHot = getRoomProperty(room, "hot") === true;
  const isToxic = getRoomProperty(room, "toxic") === true;

  if (isHot && isToxic) {
    console.warn(
      `Room ${room.id ?? "?"}: "hot" and "toxic" can not be together: it is "hot"`
    );
  }

  let hazard: HazardType = Hazard.NONE;
  if (isHot) {
    hazard = Hazard.HOT;
  } else if (isToxic) {
    hazard = Hazard.TOXIC;
  }

  return { dark: typeof darkness === "string" && darkness !== "", hazard };
}

export function buildMinimapMap(source: MinimapSource): MinimapMap {
  const { cols, rows, tileSize } = source;
  const terrain = new Uint8Array(cols * rows);
  const edge = new Uint8Array(cols * rows);
  const roomOf = new Int16Array(cols * rows).fill(-1);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      terrain[row * cols + col] = getTerrain(source, col, row);
    }
  }

  source.rooms.forEach((room, roomIndex) => {
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
        // Where the rooms share a cell, the first one has it
        if (roomOf[row * cols + col] < 0) {
          roomOf[row * cols + col] = roomIndex;
        }

        if (col === left || col === right - 1 || row === top || row === bottom - 1) {
          edge[row * cols + col] = 1;
        }
      }
    }
  });

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

  return {
    cols,
    rows,
    tileSize,
    terrain,
    roomOf,
    rooms: source.rooms.map(getRoomFlags),
    edge,
    pois,
  };
}
