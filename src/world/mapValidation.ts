import { REQUIRED_TILESETS, REQUIRED_TILE_LAYERS } from "@/config/maps";
import { TILE_SIZE } from "@/config/tiles";
import { LocalDoor, MapObject, isLocalDoor } from "@/world/doors";
import { createMapObjectRegistry } from "@/world/mapObjectHandlers";
import { OBJECT_SCHEMAS } from "@/world/objectSchemas";
import { roomContains } from "@/world/rooms";
import { readRawObjects } from "@/world/tiledObjects";

/**
 * Checking the data of a map written in Tiled, with no dependency on Phaser:
 * what the game would find out only when it runs (a layer it needs, a room
 * which is not where the camera can show it, a door to nowhere) is told with
 * the name of the object, before.
 */
export interface MapProblems {
  /** The game would not work, or an object would be missing */
  errors: string[];
  /** Probably a mistake, but the game works */
  warnings: string[];
}

export interface MapRequirements {
  tileLayers: readonly string[];
  tilesets: readonly string[];
  tileSize: number;
}

export const GAME_REQUIREMENTS: MapRequirements = {
  tileLayers: REQUIRED_TILE_LAYERS,
  tilesets: REQUIRED_TILESETS,
  tileSize: TILE_SIZE,
};

interface RawMap {
  tilewidth?: number;
  tileheight?: number;
  layers?: { name?: string; type?: string; objects?: MapObject[] }[];
  tilesets?: { name?: string }[];
}

/** Do the two rooms share some area? (touching borders do not count) */
function overlap(a: MapObject, b: MapObject): boolean {
  const [ax, ay, aw, ah] = [a.x ?? 0, a.y ?? 0, a.width ?? 0, a.height ?? 0];
  const [bx, by, bw, bh] = [b.x ?? 0, b.y ?? 0, b.width ?? 0, b.height ?? 0];

  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

const label = (object: MapObject) =>
  `${object.id}${object.name ? ` "${object.name}"` : ""}`;

/**
 * Check a map, as the raw JSON Tiled saves
 *
 * @param map          The JSON of the map
 * @param requirements What the game needs of a map
 */
export function validateMap(
  map: unknown,
  requirements: MapRequirements = GAME_REQUIREMENTS
): MapProblems {
  const errors: string[] = [];
  const warnings: string[] = [];
  const raw = (map ?? {}) as RawMap;
  const layers = raw.layers ?? [];

  // --- The tile layers, the tilesets and the size of the tiles
  if (
    raw.tilewidth !== requirements.tileSize ||
    raw.tileheight !== requirements.tileSize
  ) {
    errors.push(
      `the tiles are ${raw.tilewidth}x${raw.tileheight}, the game needs ${requirements.tileSize}x${requirements.tileSize}`
    );
  }

  for (const name of requirements.tileLayers) {
    if (
      !layers.some((layer) => layer.type === "tilelayer" && layer.name === name)
    ) {
      errors.push(`there is no tile layer "${name}"`);
    }
  }

  for (const name of requirements.tilesets) {
    if (!(raw.tilesets ?? []).some((tileset) => tileset.name === name)) {
      errors.push(`there is no tileset "${name}"`);
    }
  }

  // --- The objects: made as the game makes them
  const rooms: MapObject[] = [];
  const spawnPoints: MapObject[] = [];
  const savePoints: MapObject[] = [];
  const platforms: MapObject[] = [];
  const doors: LocalDoor[] = [];

  const registry = createMapObjectRegistry<MapObject>();
  const objectLayers = [
    ...new Set(OBJECT_SCHEMAS.map((schema) => schema.layer)),
  ];

  for (const layer of layers) {
    if (
      layer.type === "objectgroup" &&
      !objectLayers.includes(layer.name ?? "")
    ) {
      warnings.push(`the object layer "${layer.name}" is not read by the game`);
    }
  }

  const ids = new Set<number>();

  for (const layerName of objectLayers) {
    const objects = readRawObjects(raw, layerName) as MapObject[];

    if (
      layerName === "objects" &&
      !layers.some(
        (layer) => layer.type === "objectgroup" && layer.name === layerName
      )
    ) {
      errors.push(`there is no object layer "${layerName}"`);
    }

    for (const object of objects) {
      if (ids.has(object.id)) {
        errors.push(`the id ${object.id} is used by two objects`);
      }

      ids.add(object.id);
    }

    const report = registry.spawn(
      layerName,
      objects,
      {
        addRoom: (room) => rooms.push(room),
        addSavePoint: (point) => savePoints.push(point),
        setSpawnPoint: (point) => spawnPoints.push(point),
        addDoor: (door) => {
          if (isLocalDoor(door)) {
            doors.push(door);
          }
        },
        addPlatform: (platform) => platforms.push(platform),
      },
      () => {}
    );

    for (const skipped of report.skipped) {
      errors.push(
        `object ${skipped.id} of the layer "${layerName}" ${skipped.reason}`
      );
    }

    warnings.push(...report.warnings);
  }

  // --- Rooms
  if (rooms.length === 0) {
    errors.push("there are no rooms");
  }

  for (const room of rooms) {
    if (!room.width || !room.height) {
      errors.push(`room ${label(room)} has no size`);
    }
  }

  rooms.forEach((room, index) => {
    for (const other of rooms.slice(index + 1)) {
      if (overlap(room, other)) {
        errors.push(`rooms ${label(room)} and ${label(other)} overlap`);
      }
    }
  });

  const names = new Map<string, number>();
  for (const room of rooms) {
    if (room.name) {
      names.set(room.name, (names.get(room.name) ?? 0) + 1);
    }
  }

  for (const [name, count] of names) {
    if (count > 1) {
      warnings.push(
        `${count} rooms are called "${name}" (their ids are different, but the names are confusing)`
      );
    }
  }

  const inARoom = (x: number, y: number) =>
    rooms.some((room) => roomContains(room, x, y));

  // --- The spawn point and the save points
  if (spawnPoints.length !== 1) {
    errors.push(
      `there must be one spawn point, there are ${spawnPoints.length}`
    );
  }

  for (const spawn of spawnPoints) {
    if (!inARoom(spawn.x ?? 0, spawn.y ?? 0)) {
      errors.push(`the spawn point ${label(spawn)} is not inside a room`);
    }
  }

  const savePointNames = new Set<string>();
  for (const point of savePoints) {
    if (savePointNames.has(point.name as string)) {
      errors.push(`two save points are called "${point.name}"`);
    }

    savePointNames.add(point.name as string);

    if (!inARoom(point.x ?? 0, point.y ?? 0)) {
      errors.push(`the save point ${label(point)} is not inside a room`);
    }
  }

  if (savePoints.length === 0) {
    warnings.push("there is no save point");
  }

  // --- Doors and platforms
  for (const door of doors) {
    if (!inARoom(door.target.x, door.target.y)) {
      errors.push(
        `the door ${door.id} leads to ${door.target.x}, ${door.target.y}, which is not inside a room`
      );
    }

    if (!inARoom(door.x + door.width / 2, door.y + door.height / 2)) {
      warnings.push(`the door ${door.id} is not inside a room`);
    }
  }

  for (const platform of platforms) {
    if (!inARoom(platform.x ?? 0, platform.y ?? 0)) {
      warnings.push(`the platform ${platform.id} does not start inside a room`);
    }
  }

  return { errors, warnings };
}
