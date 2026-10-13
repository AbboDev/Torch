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
