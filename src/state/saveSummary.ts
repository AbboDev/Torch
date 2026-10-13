import { PowerUps } from "@/miscellaneous/Inventory";
import { GameState } from "@/state/GameState";
import { SLOT_COUNT, SaveFile, SaveManager } from "@/state/SaveManager";

/**
 * What a save slot shows about the game in it. It is worked out from the
 * save when the slots are listed, never stored: a new field of the state
 * (a percentage of completion, bosses defeated...) is added here once, and
 * every save already written shows it.
 */
export interface SaveSummary {
  savedAt: string;
  /** Milliseconds played */
  playTime: number;
  life: number;
  maxLife: number;
  /** Power-ups owned, out of all the power-ups of the game */
  powerUps: number;
  powerUpsTotal: number;
  weapons: number;
  rooms: number;
  savePoint: string | null;
}

export interface SlotInfo {
  slot: number;
  /** Null when the slot is empty (or its save can not be read) */
  summary: SaveSummary | null;
}

export function summarize(file: SaveFile): SaveSummary {
  // The state reads a save with all the checks, so a damaged one is safe here
  const state = new GameState();
  state.restore(file.state);

  const powerUps = Object.values(PowerUps);

  return {
    savedAt: typeof file.savedAt === "string" ? file.savedAt : "",
    playTime: state.getPlayTime(),
    life: state.get("life"),
    maxLife: state.get("maxLife"),
    powerUps: powerUps.filter((item) => state.inventory.has(item)).length,
    powerUpsTotal: powerUps.length,
    weapons: state.inventory.getWeaponIds().length,
    rooms: state.getVisitedRoomCount(),
    savePoint: state.getSavePoint()?.id ?? null,
  };
}

/** Every slot, in order, with what it holds */
export function listSlots(
  saves: SaveManager,
  count: number = SLOT_COUNT
): SlotInfo[] {
  return Array.from({ length: count }, (_, slot) => {
    const file = saves.load(slot);

    return { slot, summary: file ? summarize(file) : null };
  });
}

/** Hours and minutes: "0:42", "12:05" */
export function formatPlayTime(milliseconds: number): string {
  const totalMinutes = Math.floor(Math.max(0, milliseconds) / 60000);
  const minutes = totalMinutes % 60;

  return `${Math.floor(totalMinutes / 60)}:${String(minutes).padStart(2, "0")}`;
}

/** The date of a save, or "" if it has none */
export function formatSavedAt(iso: string): string {
  const date = new Date(iso);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

/** The text shown under a slot: two short lines */
export function describeSummary(summary: SaveSummary): string {
  const progress = [
    formatPlayTime(summary.playTime),
    `${summary.powerUps}/${summary.powerUpsTotal} power-ups`,
    `${summary.rooms} rooms`,
  ].join("  ·  ");

  return [formatSavedAt(summary.savedAt), progress]
    .filter((line) => line !== "")
    .join("\n");
}
