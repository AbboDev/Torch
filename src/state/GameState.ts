import { Emitter } from "@/state/Emitter";
import { createStatsView } from "@/state/playerStats";
import {
  Inventory,
  InventorySnapshot,
  PowerUps,
  WeaponId,
} from "@/miscellaneous/Inventory";
import { Switch } from "@/miscellaneous/Switch";
import { EncodedExplored, ExploredGrid } from "@/world/explored";

export interface PlayerStats {
  life: number;
  maxLife: number;
  ammo: number;
  maxAmmo: number;
  battery: number;
  maxBattery: number;
}

export type StatKey = keyof PlayerStats;

export const STAT_KEYS: readonly StatKey[] = [
  "life",
  "maxLife",
  "ammo",
  "maxAmmo",
  "battery",
  "maxBattery",
];

export const DEFAULT_STATS: Readonly<PlayerStats> = {
  life: 99,
  maxLife: 99,
  ammo: 30,
  maxAmmo: 30,
  battery: 0,
  maxBattery: 99,
};

/** Stats which can never go below zero */
const NON_NEGATIVE: ReadonlySet<StatKey> = new Set(["life", "battery"]);

/** A save point of a map: the game restarts from there */
export interface SavePointRef {
  /** The name of the map (see config/maps.ts) */
  map: string;
  /** The id of the save point in that map */
  id: string;
}

export interface WorldSnapshot {
  /** Stable ids of the rooms the Player has already entered, with their map */
  visitedRooms: string[];
  /** The last save point used */
  savePoint: SavePointRef | null;
  /**
   * Things which changed in the world for good (a broken block, a boss
   * defeated, a door opened...), as ids chosen by the code which sets them
   */
  flags: string[];
  /** The cells of every map the Player has seen, for the minimap */
  explored: Record<string, EncodedExplored>;
}

export interface GameStateSnapshot {
  stats: PlayerStats;
  inventory: InventorySnapshot;
  world: WorldSnapshot;
  /** How long the game has been played, in milliseconds */
  playTime: number;
}

export interface GameStateEvents extends Record<string, unknown[]> {
  stat: [key: StatKey, value: number];
  weapon: [weapon: WeaponId | null];
  powerUp: [item: PowerUps, status: Switch];
  roomVisited: [roomId: string];
  /** The whole state has been replaced (new game or load) */
  restored: [];
}

/** The minimum of Phaser's DataManager we need, to keep this file Phaser-free */
interface Registry {
  get(key: string): unknown;
  set(key: string, value: unknown): unknown;
}

export const GAME_STATE_REGISTRY_KEY = "gameState";

/**
 * Everything the game needs to remember, independent from any scene.
 *
 * Scenes, HUD and entities read and write it, and subscribe to `events`
 * instead of keeping their own copies. The same object is what gets saved.
 */
export class GameState {
  public readonly events = new Emitter<GameStateEvents>();

  public readonly inventory: Inventory = new Inventory({
    weaponChanged: (weapon) => this.events.emit("weapon", weapon),
    powerUpChanged: (item, status) => this.events.emit("powerUp", item, status),
  });

  private stats: PlayerStats = { ...DEFAULT_STATS };

  /**
   * The stats as properties of an object, to read and write them like
   * `state.player.life -= 5`. Same as `get` and `set`.
   */
  public readonly player: PlayerStats = createStatsView(this);

  private visitedRooms = new Set<string>();

  private savePoint: SavePointRef | null = null;

  private flags = new Set<string>();

  private playTime = 0;

  /**
   * The save slot this run is played in. It is about the session, not the
   * game: it is not saved, and loading or resetting the state keeps it.
   */
  private activeSlot = 0;

  /** The maps in use: what is seen of a map is a grid of cells */
  private exploredGrids = new Map<string, ExploredGrid>();

  /** What was loaded for the maps which have not been asked for yet */
  private exploredSaved = new Map<string, unknown>();

  /**
   * Get the state attached to the Game (Phaser's global registry),
   * creating it the first time. It survives any scene restart.
   */
  public static from(registry: Registry): GameState {
    let state = registry.get(GAME_STATE_REGISTRY_KEY) as GameState | undefined;
    if (!state) {
      state = new GameState();
      registry.set(GAME_STATE_REGISTRY_KEY, state);
    }

    return state;
  }

  public get(key: StatKey): number {
    return this.stats[key];
  }

  public set(key: StatKey, value: number): void {
    let next = NON_NEGATIVE.has(key) && value < 0 ? 0 : value;

    // A recharge tick can land after a save filled the battery
    if (key === "battery") {
      next = Math.min(next, this.stats.maxBattery);
    }

    if (this.stats[key] === next) {
      return;
    }

    this.stats[key] = next;
    this.events.emit("stat", key, next);
  }

  public visitRoom(roomId: string): void {
    if (!this.visitedRooms.has(roomId)) {
      this.visitedRooms.add(roomId);
      this.events.emit("roomVisited", roomId);
    }
  }

  public hasVisitedRoom(roomId: string): boolean {
    return this.visitedRooms.has(roomId);
  }

  /**
   * What the Player has seen of a map. The same grid comes back every time, so
   * it can be written to: it is part of the state, and is saved with it.
   *
   * @param mapId The map, e.g. the key of its file
   * @param cols  The width of the map, in tiles
   * @param rows  The height of the map, in tiles
   */
  public getExplored(mapId: string, cols: number, rows: number): ExploredGrid {
    let grid = this.exploredGrids.get(mapId);

    if (!grid || grid.cols !== cols || grid.rows !== rows) {
      // Loaded, or the map has changed in size: what is known fits the new map
      grid = ExploredGrid.decode(
        grid ? grid.encode() : this.exploredSaved.get(mapId),
        cols,
        rows
      );
      this.exploredGrids.set(mapId, grid);
      this.exploredSaved.delete(mapId);
    }

    return grid;
  }

  public getSavePoint(): SavePointRef | null {
    return this.savePoint;
  }

  public setSavePoint(savePoint: SavePointRef | null): void {
    this.savePoint = savePoint ? { ...savePoint } : null;
  }

  /** Remember that something changed in the world (saved with the game) */
  public setFlag(flag: string): void {
    this.flags.add(flag);
  }

  public hasFlag(flag: string): boolean {
    return this.flags.has(flag);
  }

  public getActiveSlot(): number {
    return this.activeSlot;
  }

  public setActiveSlot(slot: number): void {
    this.activeSlot = slot;
  }

  /** Milliseconds played so far in this run */
  public getPlayTime(): number {
    return this.playTime;
  }

  public addPlayTime(milliseconds: number): void {
    if (Number.isFinite(milliseconds) && milliseconds > 0) {
      this.playTime += milliseconds;
    }
  }

  /** How many different rooms the Player has entered */
  public getVisitedRoomCount(): number {
    return this.visitedRooms.size;
  }

  public snapshot(): GameStateSnapshot {
    return {
      stats: { ...this.stats },
      inventory: this.inventory.snapshot(),
      world: {
        visitedRooms: [...this.visitedRooms],
        savePoint: this.savePoint ? { ...this.savePoint } : null,
        flags: [...this.flags],
        explored: this.snapshotExplored(),
      },
      playTime: this.playTime,
    };
  }

  /**
   * Replace the whole state with a snapshot (missing fields fall back to the
   * defaults, unknown ones are ignored), then tell everybody to refresh.
   */
  public restore(snapshot: Partial<GameStateSnapshot> | undefined): void {
    const stats: PlayerStats = { ...DEFAULT_STATS };
    for (const key of STAT_KEYS) {
      const stored = snapshot?.stats?.[key];
      if (typeof stored === "number" && Number.isFinite(stored)) {
        stats[key] = NON_NEGATIVE.has(key) ? Math.max(0, stored) : stored;
      }
    }

    // A save written while the battery was past its maximum
    stats.battery = Math.min(stats.battery, stats.maxBattery);

    this.stats = stats;
    this.inventory.restore(snapshot?.inventory);
    this.visitedRooms = new Set(
      (snapshot?.world?.visitedRooms ?? []).filter(
        (id) => typeof id === "string"
      )
    );
    this.flags = new Set(
      (snapshot?.world?.flags ?? []).filter((flag) => typeof flag === "string")
    );
    const playTime = snapshot?.playTime;
    this.playTime =
      typeof playTime === "number" && Number.isFinite(playTime)
        ? Math.max(0, playTime)
        : 0;
    const savePoint = snapshot?.world?.savePoint;
    // A save point is a map and a name (an older save had only a name: it is dropped)
    this.savePoint =
      savePoint &&
      typeof savePoint.map === "string" &&
      typeof savePoint.id === "string"
        ? { map: savePoint.map, id: savePoint.id }
        : null;

    // What is wrong is dropped when the map asks for it (see `ExploredGrid.decode`)
    this.exploredGrids = new Map();
    const explored = snapshot?.world?.explored;
    this.exploredSaved = new Map(
      explored && typeof explored === "object"
        ? Object.entries(explored).filter(
            ([, saved]) => typeof saved === "object" && saved !== null
          )
        : []
    );

    this.events.emit("restored");
  }

  private snapshotExplored(): Record<string, EncodedExplored> {
    const explored: Record<string, EncodedExplored> = {};

    // Keep what was loaded for the maps not visited since, as it was
    for (const [mapId, saved] of this.exploredSaved) {
      explored[mapId] = saved as EncodedExplored;
    }

    for (const [mapId, grid] of this.exploredGrids) {
      explored[mapId] = grid.encode();
    }

    return explored;
  }

  /** Start from scratch */
  public reset(): void {
    this.restore(undefined);
  }
}
