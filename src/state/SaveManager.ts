import { GameState, GameStateSnapshot } from "@/state/GameState";

export const SAVE_VERSION = 1;

export interface SaveFile {
  version: number;
  savedAt: string;
  state: GameStateSnapshot;
}

/**
 * Where the saves are written. `localStorage` today; a Tauri filesystem
 * backend can implement the same three methods tomorrow.
 */
export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryStorage implements StorageBackend {
  private data = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  public removeItem(key: string): void {
    this.data.delete(key);
  }
}

const defaultBackend = (): StorageBackend => {
  try {
    const storage = globalThis.localStorage;
    // Some browsers throw as soon as the storage is touched (private mode)
    storage.getItem("torch:probe");

    return storage;
  } catch {
    console.warn("localStorage unavailable: saves will not survive a reload");

    return new MemoryStorage();
  }
};

/**
 * Upgrade functions: `MIGRATIONS[n]` converts a save from version n to n + 1.
 * Add one whenever the shape of the save changes and bump SAVE_VERSION.
 */
const MIGRATIONS: Record<number, (save: any) => any> = {};

export class SaveManager {
  public constructor(
    private readonly backend: StorageBackend = defaultBackend(),
    private readonly prefix = "torch:save:"
  ) {}

  private key(slot: number): string {
    return `${this.prefix}${slot}`;
  }

  /**
   * Write the current state to a slot.
   *
   * @param state       The state to save
   * @param slot        Save slot (default 0)
   * @param savePointId When saving at a save point, its id: the game will restart from there
   */
  public save(state: GameState, slot = 0, savePointId?: string): SaveFile {
    if (savePointId !== undefined) {
      state.setSavePoint(savePointId);
    }

    const file: SaveFile = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      state: state.snapshot(),
    };

    this.backend.setItem(this.key(slot), JSON.stringify(file));

    return file;
  }

  /**
   * Read a slot. Returns null when it is empty, corrupted, or written by a
   * newer version of the game.
   */
  public load(slot = 0): SaveFile | null {
    const raw = this.backend.getItem(this.key(slot));
    if (raw === null) {
      return null;
    }

    try {
      let file = JSON.parse(raw);
      if (!file || !Number.isInteger(file.version) || file.version < 1) {
        return null;
      }

      if (file.version > SAVE_VERSION) {
        console.warn(`Save slot ${slot} comes from a newer version`);

        return null;
      }

      while (file.version < SAVE_VERSION) {
        const migrate = MIGRATIONS[file.version];
        if (!migrate) {
          return null;
        }

        file = { ...migrate(file), version: file.version + 1 };
      }

      return file as SaveFile;
    } catch {
      console.warn(`Save slot ${slot} is corrupted`);

      return null;
    }
  }

  /** Load a slot into the state. Returns false if there is nothing to load. */
  public loadInto(state: GameState, slot = 0): boolean {
    const file = this.load(slot);
    if (!file) {
      return false;
    }

    state.restore(file.state);

    return true;
  }

  public has(slot = 0): boolean {
    return this.load(slot) !== null;
  }

  public delete(slot = 0): void {
    this.backend.removeItem(this.key(slot));
  }
}
