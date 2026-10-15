/**
 * The maps of the game. Today there is one; every area will have its own
 * (see the README, "Rooms, doors and backgrounds").
 */
export interface MapConfig {
  /** The name of the map in saves and in the ids of its rooms */
  key: string;
  /** The key of the Tiled JSON in the cache of Phaser */
  cacheKey: string;
}

export const MAIN_MAP: MapConfig = {
  key: "chozodia",
  cacheKey: "chozodia_map",
};

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
