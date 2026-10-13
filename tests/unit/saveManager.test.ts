import { describe, expect, it, vi } from "vitest";
import { GameState } from "@/state/GameState";
import { MemoryStorage, SAVE_VERSION, SaveManager } from "@/state/SaveManager";

describe("SaveManager", () => {
  it("returns null for an empty slot", () => {
    const manager = new SaveManager(new MemoryStorage());

    expect(manager.load()).toBeNull();
    expect(manager.has()).toBe(false);
  });

  it("keeps slots separate and can delete them", () => {
    const manager = new SaveManager(new MemoryStorage());
    const state = new GameState();

    state.set("life", 10);
    manager.save(state, 1);

    expect(manager.has(0)).toBe(false);
    expect(manager.load(1)?.state.stats.life).toBe(10);

    manager.delete(1);
    expect(manager.has(1)).toBe(false);
  });

  it("records the save point when saving at one", () => {
    const manager = new SaveManager(new MemoryStorage());
    const state = new GameState();

    manager.save(state, 0, { map: "chozodia", id: "save_lab" });

    const expected = { map: "chozodia", id: "save_lab" };
    expect(manager.load()?.state.world.savePoint).toEqual(expected);
    expect(state.getSavePoint()).toEqual(expected);
  });

  it("ignores corrupted saves", () => {
    const storage = new MemoryStorage();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    storage.setItem("torch:save:0", "{not json");

    expect(new SaveManager(storage).load()).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it("ignores saves from a newer version of the game", () => {
    const storage = new MemoryStorage();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    storage.setItem(
      "torch:save:0",
      JSON.stringify({ version: SAVE_VERSION + 1, state: {} })
    );

    expect(new SaveManager(storage).load()).toBeNull();
  });

  it("ignores saves without a valid version", () => {
    const storage = new MemoryStorage();
    storage.setItem("torch:save:0", JSON.stringify({ state: {} }));

    expect(new SaveManager(storage).load()).toBeNull();
  });

  it("loadInto reports whether anything was loaded", () => {
    const manager = new SaveManager(new MemoryStorage());
    const state = new GameState();

    expect(manager.loadInto(state)).toBe(false);

    manager.save(state);
    expect(manager.loadInto(state)).toBe(true);
  });
});
