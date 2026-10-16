import { describe, expect, it, vi } from "vitest";
import { GameState, DEFAULT_STATS } from "@/state/GameState";
import { PowerUps } from "@/miscellaneous/Inventory";
import { MemoryStorage, SaveManager } from "@/state/SaveManager";

describe("game state", () => {
  it("is created once and shared through a registry", () => {
    const data = new Map<string, unknown>();
    const registry = {
      get: (key: string) => data.get(key),
      set: (key: string, value: unknown) => data.set(key, value),
    };

    expect(GameState.from(registry)).toBe(GameState.from(registry));
  });

  it("clamps life and battery at zero, the battery at its maximum, and only emits on change", () => {
    const state = new GameState();
    const listener = vi.fn();
    state.events.on("stat", listener);

    state.set("life", -20);
    state.set("life", 0);
    state.set("ammo", 12);
    state.set("battery", 150);

    expect(state.get("life")).toBe(0);
    expect(state.get("battery")).toBe(state.get("maxBattery"));
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenCalledWith("life", 0);
    expect(listener).toHaveBeenCalledWith("ammo", 12);
    expect(listener).toHaveBeenCalledWith("battery", 99);
  });

  it("emits weapon and power-up changes from the inventory", () => {
    const state = new GameState();
    const onWeapon = vi.fn();
    const onPowerUp = vi.fn();
    state.events.on("weapon", onWeapon);
    state.events.on("powerUp", onPowerUp);

    state.inventory.addWeapon("rifle");
    state.inventory.grant(PowerUps.DASH);

    expect(onWeapon).toHaveBeenCalledWith("rifle");
    expect(onPowerUp).toHaveBeenCalled();
  });

  it("tracks visited rooms once, also for rooms without properties", () => {
    const state = new GameState();
    const listener = vi.fn();
    state.events.on("roomVisited", listener);

    state.visitRoom("room_start");
    state.visitRoom("room_start");

    expect(state.hasVisitedRoom("room_start")).toBe(true);
    expect(state.hasVisitedRoom("room_bottom")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("remembers the flags of the world and saves them", () => {
    const manager = new SaveManager(new MemoryStorage());
    const state = new GameState();

    state.setFlag("map:breakable:3,4");
    manager.save(state);

    const loaded = new GameState();
    manager.loadInto(loaded);

    expect(loaded.hasFlag("map:breakable:3,4")).toBe(true);
    expect(loaded.hasFlag("map:breakable:0,0")).toBe(false);
  });

  it("loads a save written before the flags existed", () => {
    const state = new GameState();
    state.setFlag("something");

    state.restore({ world: { visitedRooms: [], savePoint: null } } as never);

    expect(state.hasFlag("something")).toBe(false);
  });

  it("brings a saved battery that passed its maximum back down", () => {
    const state = new GameState();

    state.restore({
      stats: { ...state.snapshot().stats, battery: 140 },
    });

    expect(state.get("battery")).toBe(state.get("maxBattery"));
  });

  it("counts the time played, saves it and ignores invalid values", () => {
    const state = new GameState();

    state.addPlayTime(1500);
    state.addPlayTime(-10);
    state.addPlayTime(Number.NaN);
    expect(state.getPlayTime()).toBe(1500);

    const loaded = new GameState();
    loaded.restore(state.snapshot());
    expect(loaded.getPlayTime()).toBe(1500);

    loaded.restore({ playTime: "soon" } as never);
    expect(loaded.getPlayTime()).toBe(0);
  });

  it("round-trips through a save and restores everything", () => {
    const manager = new SaveManager(new MemoryStorage());
    const original = new GameState();

    original.set("life", 42);
    original.set("maxAmmo", 60);
    original.inventory.grant(PowerUps.ROCKET);
    original.inventory.addWeapon("gun").addWeapon("bow");
    original.visitRoom("chozodia/room_6");
    manager.save(original, 0, { map: "chozodia", id: "save_lab" });

    const loaded = new GameState();
    const onRestored = vi.fn();
    loaded.events.on("restored", onRestored);

    expect(manager.loadInto(loaded)).toBe(true);

    expect(loaded.get("life")).toBe(42);
    expect(loaded.get("maxAmmo")).toBe(60);
    expect(loaded.inventory.equip(PowerUps.ROCKET)).toBe(true);
    expect(loaded.inventory.getWeaponIds()).toEqual(["gun", "bow"]);
    expect(loaded.inventory.getCurrentWeaponId()).toBe("bow");
    expect(loaded.hasVisitedRoom("chozodia/room_6")).toBe(true);
    expect(loaded.getSavePoint()).toEqual({ map: "chozodia", id: "save_lab" });
    expect(onRestored).toHaveBeenCalledTimes(1);
  });

  it("falls back to defaults for missing or invalid fields", () => {
    const state = new GameState();
    state.set("life", 5);

    state.restore({ stats: { life: "x", ammo: 7 } as never });

    expect(state.get("life")).toBe(DEFAULT_STATS.life);
    expect(state.get("ammo")).toBe(7);
    expect(state.inventory.hasAtLeastOneRangeWeapon()).toBe(false);
  });

  it("reset starts a new game", () => {
    const state = new GameState();
    state.set("life", 1);
    state.visitRoom("a");
    state.setSavePoint({ map: "chozodia", id: "b" });

    state.reset();

    expect(state.get("life")).toBe(DEFAULT_STATS.life);
    expect(state.hasVisitedRoom("a")).toBe(false);
    expect(state.getSavePoint()).toBeNull();
  });
});

describe("the save point of a save", () => {
  it("is a map and a name, and does not leak into the state which was saved", () => {
    const state = new GameState();
    const point = { map: "cave", id: "save_1" };

    state.setSavePoint(point);
    point.id = "changed";

    expect(state.getSavePoint()).toEqual({ map: "cave", id: "save_1" });
  });

  it("drops a save point which is only a name, like the ones saved before maps had names", () => {
    const state = new GameState();

    state.restore({
      world: {
        visitedRooms: [],
        savePoint: "save_lab" as never,
        flags: [],
        explored: {},
      },
    });

    expect(state.getSavePoint()).toBeNull();
  });
});
