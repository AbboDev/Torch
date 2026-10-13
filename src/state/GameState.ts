import { Emitter } from "@/state/Emitter";
import { createStatsView } from "@/state/playerStats";
import {
  Inventory,
  InventorySnapshot,
  PowerUps,
  WeaponId,
} from "@/miscellaneous/Inventory";
import { Switch } from "@/miscellaneous/Switch";

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
  /** The name of the object in Tiled */
  id: string;
}

export interface WorldSnapshot {
  /** Stable ids of the rooms the Player has already entered, with their map */
  visitedRooms: string[];
  /** The last save point used */
  savePoint: SavePointRef | null;
}

export interface GameStateSnapshot {
  stats: PlayerStats;
  inventory: InventorySnapshot;
  world: WorldSnapshot;
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
    const next = NON_NEGATIVE.has(key) && value < 0 ? 0 : value;

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

  public getSavePoint(): SavePointRef | null {
    return this.savePoint;
  }

  public setSavePoint(savePoint: SavePointRef | null): void {
    this.savePoint = savePoint ? { ...savePoint } : null;
  }

  public snapshot(): GameStateSnapshot {
    return {
      stats: { ...this.stats },
      inventory: this.inventory.snapshot(),
      world: {
        visitedRooms: [...this.visitedRooms],
        savePoint: this.savePoint ? { ...this.savePoint } : null,
      },
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

    this.stats = stats;
    this.inventory.restore(snapshot?.inventory);
    this.visitedRooms = new Set(
      (snapshot?.world?.visitedRooms ?? []).filter(
        (id) => typeof id === "string"
      )
    );
    const savePoint = snapshot?.world?.savePoint;
    // A save point is a map and a name (an older save had only a name: it is dropped)
    this.savePoint =
      savePoint &&
      typeof savePoint.map === "string" &&
      typeof savePoint.id === "string"
        ? { map: savePoint.map, id: savePoint.id }
        : null;

    this.events.emit("restored");
  }

  /** Start from scratch */
  public reset(): void {
    this.restore(undefined);
  }
}
