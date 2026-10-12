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

  it("clamps life and battery at zero and only emits on change", () => {
    const state = new GameState();
    const listener = vi.fn();
    state.events.on("stat", listener);

    state.set("life", -20);
    state.set("life", 0);
    state.set("ammo", 12);

    expect(state.get("life")).toBe(0);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith("life", 0);
    expect(listener).toHaveBeenCalledWith("ammo", 12);
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

  it("round-trips through a save and restores everything", () => {
    const manager = new SaveManager(new MemoryStorage());
    const original = new GameState();

    original.set("life", 42);
    original.set("maxAmmo", 60);
    original.inventory.grant(PowerUps.ROCKET);
    original.inventory.addWeapon("gun").addWeapon("bow");
    original.visitRoom("room_start");
    manager.save(original, 0, "save_lab");

    const loaded = new GameState();
    const onRestored = vi.fn();
    loaded.events.on("restored", onRestored);

    expect(manager.loadInto(loaded)).toBe(true);

    expect(loaded.get("life")).toBe(42);
    expect(loaded.get("maxAmmo")).toBe(60);
    expect(loaded.inventory.equip(PowerUps.ROCKET)).toBe(true);
    expect(loaded.inventory.getWeaponIds()).toEqual(["gun", "bow"]);
    expect(loaded.inventory.getCurrentWeaponId()).toBe("bow");
    expect(loaded.hasVisitedRoom("room_start")).toBe(true);
    expect(loaded.getSavePoint()).toBe("save_lab");
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
    state.setSavePoint("b");

    state.reset();

    expect(state.get("life")).toBe(DEFAULT_STATS.life);
    expect(state.hasVisitedRoom("a")).toBe(false);
    expect(state.getSavePoint()).toBeNull();
  });
});
