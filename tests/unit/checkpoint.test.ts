import { describe, expect, it, vi } from "vitest";
import { PowerUps } from "@/miscellaneous/Inventory";
import {
  continueGame,
  refillStats,
  respawn,
  startNewGame,
  useSavePoint,
} from "@/state/checkpoint";
import { DEFAULT_STATS, GameState } from "@/state/GameState";
import { MemoryStorage, SaveManager } from "@/state/SaveManager";
import { breakableFlag } from "@/world/worldFlags";

const hurt = (state: GameState) => {
  state.set("life", 7);
  state.set("ammo", 1);
  state.set("battery", 2);
};

const savePoint = (id: string) => ({ map: "chozodia", id });

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

    useSavePoint(state, saves, savePoint("save_lab"));

    const saved = saves.load();
    expect(saved?.state.stats.life).toBe(DEFAULT_STATS.maxLife);
    expect(saved?.state.world.savePoint).toEqual(savePoint("save_lab"));
    expect(state.getSavePoint()).toEqual(savePoint("save_lab"));
  });
});

describe("respawn", () => {
  it("goes back to the last save and loses what came after it", () => {
    const saves = new SaveManager(new MemoryStorage());
    const state = new GameState();
    state.inventory.grant(PowerUps.DASH);
    state.setFlag(breakableFlag("map", 1, 2));
    useSavePoint(state, saves, savePoint("save_lab"));

    state.inventory.grant(PowerUps.ROCKET);
    state.setFlag(breakableFlag("map", 3, 4));
    state.visitRoom("room_after_save");
    state.set("life", 0);

    expect(respawn(state, saves)).toBe("loaded");

    expect(state.get("life")).toBe(DEFAULT_STATS.maxLife);
    expect(state.getSavePoint()).toEqual(savePoint("save_lab"));
    expect(state.inventory.equip(PowerUps.DASH)).toBe(true);
    expect(state.inventory.equip(PowerUps.ROCKET)).toBe(false);
    expect(state.hasFlag(breakableFlag("map", 1, 2))).toBe(true);
    expect(state.hasFlag(breakableFlag("map", 3, 4))).toBe(false);
    expect(state.hasVisitedRoom("room_after_save")).toBe(false);
  });

  it("starts from scratch when there is no save", () => {
    const state = new GameState();
    state.inventory.grant(PowerUps.DASH);
    state.set("life", 0);

    expect(respawn(state, new SaveManager(new MemoryStorage()))).toBe("new");

    expect(state.get("life")).toBe(DEFAULT_STATS.life);
    expect(state.inventory.equip(PowerUps.DASH)).toBe(false);
    expect(state.getSavePoint()).toBeNull();
  });

  it("starts from scratch when the save is corrupted", () => {
    const storage = new MemoryStorage();
    storage.setItem("torch:save:0", "{not json");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const state = new GameState();
    state.set("life", 0);

    expect(respawn(state, new SaveManager(storage))).toBe("new");
    expect(state.get("life")).toBe(DEFAULT_STATS.life);
  });

  it("does not bring the Player back with no life", () => {
    const storage = new MemoryStorage();
    const saves = new SaveManager(storage);
    const state = new GameState();
    state.set("life", 0);
    saves.save(state);

    expect(respawn(new GameState(), saves)).toBe("loaded");

    const revived = new GameState();
    respawn(revived, saves);
    expect(revived.get("life")).toBe(DEFAULT_STATS.maxLife);
  });
});

describe("startNewGame", () => {
  it("erases the old save, so dying early does not bring it back", () => {
    const saves = new SaveManager(new MemoryStorage());
    const state = new GameState();
    state.inventory.grant(PowerUps.DASH);
    useSavePoint(state, saves, savePoint("save_lab"));

    startNewGame(state, saves, 0);

    expect(saves.has()).toBe(false);
    expect(state.getSavePoint()).toBeNull();
    expect(state.inventory.equip(PowerUps.DASH)).toBe(false);
    expect(respawn(state, saves)).toBe("new");
  });
});

describe("save slots", () => {
  it("saves in the slot of the run and brings it back from the same one", () => {
    const saves = new SaveManager(new MemoryStorage());
    const state = new GameState();

    startNewGame(state, saves, 2);
    state.inventory.grant(PowerUps.DASH);
    useSavePoint(state, saves, savePoint("save_lab"));

    expect(saves.has(2)).toBe(true);
    expect(saves.has(0)).toBe(false);

    state.inventory.grant(PowerUps.ROCKET);
    state.set("life", 0);

    expect(respawn(state, saves)).toBe("loaded");
    expect(state.getActiveSlot()).toBe(2);
    expect(state.inventory.equip(PowerUps.DASH)).toBe(true);
    expect(state.inventory.equip(PowerUps.ROCKET)).toBe(false);
  });

  it("keeps the games of the other slots apart", () => {
    const saves = new SaveManager(new MemoryStorage());
    const state = new GameState();

    startNewGame(state, saves, 0);
    state.inventory.grant(PowerUps.DASH);
    useSavePoint(state, saves, savePoint("save_a"));

    startNewGame(state, saves, 1);
    useSavePoint(state, saves, savePoint("save_b"));

    expect(saves.load(0)?.state.world.savePoint).toEqual(savePoint("save_a"));
    expect(saves.load(1)?.state.world.savePoint).toEqual(savePoint("save_b"));

    expect(continueGame(state, saves, 0)).toBe("loaded");
    expect(state.getActiveSlot()).toBe(0);
    expect(state.inventory.equip(PowerUps.DASH)).toBe(true);
  });

  it("starts a new game when the slot played is empty", () => {
    const saves = new SaveManager(new MemoryStorage());
    const state = new GameState();
    state.inventory.grant(PowerUps.DASH);

    expect(continueGame(state, saves, 2)).toBe("new");

    expect(state.getActiveSlot()).toBe(2);
    expect(state.inventory.equip(PowerUps.DASH)).toBe(false);
  });

  it("erases only the slot where a new game starts", () => {
    const saves = new SaveManager(new MemoryStorage());
    const state = new GameState();
    useSavePoint(state, saves, savePoint("save_a"), 0);
    useSavePoint(state, saves, savePoint("save_b"), 1);

    startNewGame(state, saves, 1);

    expect(saves.has(0)).toBe(true);
    expect(saves.has(1)).toBe(false);
  });

  it("is not changed by loading or resetting the state", () => {
    const state = new GameState();
    state.setActiveSlot(3);

    state.restore(undefined);
    state.reset();

    expect(state.getActiveSlot()).toBe(3);
  });
});
