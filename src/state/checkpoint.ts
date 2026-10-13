import { GameState, SavePointRef } from "@/state/GameState";
import { SaveFile, SaveManager } from "@/state/SaveManager";

/** Fill life, ammo and battery up (the part of a save point which heals) */
export function refillStats(state: GameState): void {
  state.set("life", state.get("maxLife"));
  state.set("ammo", state.get("maxAmmo"));
  state.set("battery", state.get("maxBattery"));
}

/**
 * The Player uses a save point: it is healed, then the game is saved and will
 * restart from there. The heal comes first, so the save holds the full stats.
 */
export function useSavePoint(
  state: GameState,
  saves: SaveManager,
  savePoint: SavePointRef,
  slot = 0
): SaveFile {
  refillStats(state);

  return saves.save(state, slot, savePoint);
}

export type RespawnResult = "loaded" | "new";

/**
 * After a death: go back to the last save (what happened after it is lost),
 * or start from scratch if there is none or it can not be read.
 */
export function respawn(
  state: GameState,
  saves: SaveManager,
  slot = 0
): RespawnResult {
  if (!saves.loadInto(state, slot)) {
    state.reset();

    return "new";
  }

  // A hand-edited save with no life would kill the Player again at once
  if (state.get("life") <= 0) {
    state.set("life", state.get("maxLife"));
  }

  return "loaded";
}

/**
 * Start a new game: the slot holds the run in progress, so the old save is
 * erased, or dying before the first save point would bring the old game back.
 */
export function startNewGame(
  state: GameState,
  saves: SaveManager,
  slot = 0
): void {
  saves.delete(slot);
  state.reset();
}
