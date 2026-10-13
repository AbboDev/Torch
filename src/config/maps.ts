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
