import { describe, expect, it } from "vitest";
import { refillStats, useSavePoint } from "@/state/checkpoint";
import { DEFAULT_STATS, GameState } from "@/state/GameState";
import { MemoryStorage, SaveManager } from "@/state/SaveManager";

const hurt = (state: GameState) => {
  state.set("life", 7);
  state.set("ammo", 1);
  state.set("battery", 2);
};

const savePoint = { map: "chozodia", id: "save_lab" };

describe("refillStats", () => {
  it("fills life, ammo and battery up to their maximum", () => {
    const state = new GameState();
    state.set("maxLife", 150);
    hurt(state);

    refillStats(state);

    expect(state.get("life")).toBe(150);
    expect(state.get("ammo")).toBe(DEFAULT_STATS.maxAmmo);
    expect(state.get("battery")).toBe(DEFAULT_STATS.maxBattery);
  });
});

describe("useSavePoint", () => {
  it("heals first, so the save holds the full stats, and remembers the point", () => {
    const saves = new SaveManager(new MemoryStorage());
    const state = new GameState();
    hurt(state);

    useSavePoint(state, saves, savePoint);

    const saved = saves.load();
    expect(saved?.state.stats.life).toBe(DEFAULT_STATS.maxLife);
    expect(saved?.state.world.savePoint).toEqual(savePoint);
    expect(state.getSavePoint()).toEqual(savePoint);
  });
});
