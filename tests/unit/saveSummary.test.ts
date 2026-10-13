import { describe, expect, it } from "vitest";
import { PowerUps } from "@/miscellaneous/Inventory";
import { useSavePoint } from "@/state/checkpoint";
import { GameState } from "@/state/GameState";
import { MemoryStorage, SLOT_COUNT, SaveManager } from "@/state/SaveManager";
import {
  describeSummary,
  formatPlayTime,
  listSlots,
  summarize,
} from "@/state/saveSummary";

const savePoint = (id: string) => ({ map: "chozodia", id });

describe("listSlots", () => {
  it("lists every slot in order, the empty ones without a summary", () => {
    const saves = new SaveManager(new MemoryStorage());
    const state = new GameState();
    useSavePoint(state, saves, savePoint("save_lab"), 1);

    const slots = listSlots(saves);

    expect(slots).toHaveLength(SLOT_COUNT);
    expect(slots.map((info) => info.slot)).toEqual([0, 1, 2]);
    expect(slots.map((info) => info.summary !== null)).toEqual([
      false,
      true,
      false,
    ]);
  });
});

describe("summarize", () => {
  it("shows how far the game in the slot has gone", () => {
    const saves = new SaveManager(new MemoryStorage());
    const state = new GameState();
    const before = summarize(saves.save(state, 0));

    state.inventory.grant(PowerUps.DASH);
    state.inventory.addWeapon("gun").addWeapon("bow");
    state.visitRoom("a");
    state.visitRoom("b");
    state.addPlayTime(90 * 60000);
    const after = summarize(
      useSavePoint(state, saves, savePoint("save_lab"), 0)
    );

    expect(after.powerUps).toBe(before.powerUps + 1);
    expect(after.powerUpsTotal).toBe(Object.values(PowerUps).length);
    expect(after.weapons).toBe(2);
    expect(after.rooms).toBe(2);
    expect(after.playTime).toBe(90 * 60000);
    expect(after.savePoint).toBe("save_lab");
    expect(after.life).toBe(after.maxLife);
  });

  it("reads a save written before the play time existed", () => {
    const summary = summarize({
      version: 1,
      savedAt: "2026-01-02T10:00:00.000Z",
      state: { stats: {}, inventory: {}, world: {} } as never,
    });

    expect(summary.playTime).toBe(0);
    expect(summary.rooms).toBe(0);
    expect(summary.savePoint).toBeNull();
  });
});

describe("formatting", () => {
  it("writes the time played as hours and minutes", () => {
    expect(formatPlayTime(0)).toBe("0:00");
    expect(formatPlayTime(42 * 60000)).toBe("0:42");
    expect(formatPlayTime(125 * 60000 + 5000)).toBe("2:05");
    expect(formatPlayTime(-5)).toBe("0:00");
  });

  it("describes a slot in two lines: when, and how far", () => {
    const text = describeSummary({
      savedAt: "2026-01-02T10:00:00.000Z",
      playTime: 125 * 60000,
      life: 99,
      maxLife: 99,
      powerUps: 4,
      powerUpsTotal: 12,
      weapons: 1,
      rooms: 7,
      savePoint: "save_lab",
    });

    const lines = text.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe("2:05  ·  4/12 power-ups  ·  7 rooms");
  });

  it("leaves out the date when the save has none", () => {
    const text = describeSummary({
      savedAt: "",
      playTime: 0,
      life: 1,
      maxLife: 1,
      powerUps: 0,
      powerUpsTotal: 3,
      weapons: 0,
      rooms: 0,
      savePoint: null,
    });

    expect(text.split("\n")).toHaveLength(1);
  });
});
