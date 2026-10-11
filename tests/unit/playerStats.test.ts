import { describe, expect, it, vi } from "vitest";
import { GameState } from "@/state/GameState";

describe("state.player", () => {
  it("reads and writes the stats of the game state", () => {
    const state = new GameState();

    state.player.life -= 9;
    state.player.ammo = 12;

    expect(state.get("life")).toBe(90);
    expect(state.get("ammo")).toBe(12);
    expect(state.player.life).toBe(90);
  });

  it("goes through the rules and the events of the state", () => {
    const state = new GameState();
    const listener = vi.fn();
    state.events.on("stat", listener);

    state.player.life = -30;

    expect(state.player.life).toBe(0);
    expect(listener).toHaveBeenCalledWith("life", 0);
  });

  it("works with ++ and --", () => {
    const state = new GameState();

    ++state.player.battery;
    --state.player.ammo;

    expect(state.get("battery")).toBe(1);
    expect(state.get("ammo")).toBe(29);
  });

  it("has every stat", () => {
    const state = new GameState();

    expect(Object.keys(state.player).sort()).toEqual([
      "ammo",
      "battery",
      "life",
      "maxAmmo",
      "maxBattery",
      "maxLife",
    ]);
  });
});
