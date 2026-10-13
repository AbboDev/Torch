import { GameState, SavePointRef } from "@/state/GameState";
import { SaveFile, SaveManager } from "@/state/SaveManager";

/**
 * A run is played in one save slot, chosen on the title screen and kept in the
 * game state (`getActiveSlot`): saving at a save point and going back after a
 * death both use it, unless a slot is given.
 */

/** Fill life, ammo and battery up (the part of a save point which heals) */
export function refillStats(state: GameState): void {
  state.set("life", state.get("maxLife"));
  state.set("ammo", state.get("maxAmmo"));
  state.set("battery", state.get("maxBattery"));
}

/**
 * The Player uses a save point: it is healed, then the game is saved in the
 * slot of the run and will restart from there. The heal comes first, so the
 * save holds the full stats.
 */
export function useSavePoint(
  state: GameState,
  saves: SaveManager,
  savePoint: SavePointRef,
  slot: number = state.getActiveSlot()
): SaveFile {
  refillStats(state);

  return saves.save(state, slot, savePoint);
}

export type RespawnResult = "loaded" | "new";

/**
 * After a death: go back to the last save of the slot (what happened after it
 * is lost), or start from scratch if it is empty or can not be read.
 */
export function respawn(
  state: GameState,
  saves: SaveManager,
  slot: number = state.getActiveSlot()
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
 * Play a slot from the title screen: the run now belongs to it, and it is
 * loaded (an empty slot starts a new game).
 */
export function continueGame(
  state: GameState,
  saves: SaveManager,
  slot: number
): RespawnResult {
  state.setActiveSlot(slot);

  return respawn(state, saves, slot);
}

/**
 * Start a new game in a slot. The slot is erased: it holds the run in
 * progress, so dying before the first save point would otherwise bring the
 * old game back.
 */
export function startNewGame(
  state: GameState,
  saves: SaveManager,
  slot: number
): void {
  saves.delete(slot);
  state.setActiveSlot(slot);
  state.reset();
}
