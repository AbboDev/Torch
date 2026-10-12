/**
 * The maps of the game. A new game starts in the first one; a door with
 * `targetMap` loads another (see world/doors.ts).
 */
export interface MapConfig {
  /** The name of the map in saves and in the ids of its rooms */
  key: string;
  /** The key of the Tiled JSON in the cache of Phaser */
  cacheKey: string;
  /** The Tiled JSON, loaded by the preloader */
  file: string;
}

export const MAPS: readonly MapConfig[] = [
  {
    key: "chozodia",
    cacheKey: "chozodia_map",
    file: "assets/maps/chozodia.json",
  },
  {
    key: "chozodia_mirror",
    cacheKey: "chozodia_mirror_map",
    file: "assets/maps/chozodia_mirror.json",
  },
];

/** Where a new game starts */
export const MAIN_MAP: MapConfig = MAPS[0];

export function getMap(key: string | undefined): MapConfig | undefined {
  return MAPS.find((map) => map.key === key);
}

/** The tile layers every map of the game must have (MainScene creates them) */
export const REQUIRED_TILE_LAYERS: readonly string[] = [
  "background",
  "frontground",
  "global_frontground",
  "stairs",
  "liquids",
  "collision",
  "platforms",
  "breakables",
];

/** The tilesets every map of the game must have (the names of the images in Tiled) */
export const REQUIRED_TILESETS: readonly string[] = [
  "chozodia",
  "liquids",
  "full_liquids",
];
