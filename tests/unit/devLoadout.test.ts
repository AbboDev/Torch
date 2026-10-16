import { describe, expect, it } from "vitest";
import { Inventory, PowerUps } from "@/miscellaneous/Inventory";
import { Switch } from "@/miscellaneous/Switch";
import { applyDevLoadout } from "@/miscellaneous/devLoadout";

describe("applyDevLoadout", () => {
  it("gives a new game everything, with the torch and hook turned on", () => {
    const inventory = new Inventory();

    expect(applyDevLoadout(inventory)).toBe(true);

    expect(inventory.getWeaponIds()).toEqual(["gun", "rifle", "bow"]);
    expect(inventory.getCurrentWeaponId()).toBe("gun");
    expect(inventory.get(PowerUps.DASH)).toBe(Switch.DISABLE);
    expect(inventory.equip(PowerUps.DASH)).toBe(false);
    expect(inventory.get(PowerUps.TORCH)).toBe(Switch.ENABLE);
    expect(inventory.get(PowerUps.HOOK)).toBe(Switch.ENABLE);
  });

  it("does nothing to a game which already has weapons", () => {
    const inventory = new Inventory();
    inventory.addWeapon("bow");

    expect(applyDevLoadout(inventory)).toBe(false);

    expect(inventory.getWeaponIds()).toEqual(["bow"]);
    expect(inventory.has(PowerUps.DASH)).toBe(false);
  });

  it("does not run twice", () => {
    const inventory = new Inventory();
    applyDevLoadout(inventory);
    inventory.invertStatus(PowerUps.DASH);

    expect(applyDevLoadout(inventory)).toBe(false);
    expect(inventory.get(PowerUps.DASH)).toBe(Switch.ENABLE);
  });
});
