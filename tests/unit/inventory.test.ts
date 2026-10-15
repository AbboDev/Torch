import { describe, expect, it } from "vitest";
import { Inventory, PowerUps } from "@/miscellaneous/Inventory";
import { Switch } from "@/miscellaneous/Switch";

describe("Inventory", () => {
  it("starts with the torch, the hook and the battery only", () => {
    const inventory = new Inventory();

    expect(inventory.equip(PowerUps.TORCH)).toBe(true);
    expect(inventory.equip(PowerUps.HOOK)).toBe(true);
    expect(inventory.hasBattery()).toBe(true);
    expect(inventory.equip(PowerUps.DASH)).toBe(false);
  });

  it("toggles power-ups and notifies", () => {
    const changes: [PowerUps, Switch][] = [];
    const inventory = new Inventory({
      weaponChanged: () => {},
      powerUpChanged: (item, status) => changes.push([item, status]),
    });

    inventory.grant(PowerUps.DASH);
    expect(inventory.equip(PowerUps.DASH)).toBe(true);

    expect(inventory.invertStatus(PowerUps.DASH)).toBe(Switch.DISABLE);
    expect(changes).toEqual([
      [PowerUps.DASH, Switch.ENABLE],
      [PowerUps.DASH, Switch.DISABLE],
    ]);
  });

  it("equips a newly added weapon and ignores duplicates", () => {
    const inventory = new Inventory();

    inventory.addWeapon("gun").addWeapon("rifle").addWeapon("gun");

    expect(inventory.getWeaponIds()).toEqual(["gun", "rifle"]);
    expect(inventory.getCurrentWeaponId()).toBe("rifle");
  });

  it("can add a weapon without equipping it", () => {
    const inventory = new Inventory();

    inventory.addWeapon("gun").addWeapon("bow", false);

    expect(inventory.getCurrentWeaponId()).toBe("gun");
  });

  it("cycles through the weapons in both directions", () => {
    const inventory = new Inventory();
    inventory.addWeapon("gun").addWeapon("rifle").addWeapon("bow");

    inventory.switchCurrentWeapon("gun");
    inventory.switchToPreviousWeapon();
    expect(inventory.getCurrentWeaponId()).toBe("bow");

    inventory.switchToNextWeapon();
    expect(inventory.getCurrentWeaponId()).toBe("gun");
  });

  it("keeps the current weapon when switching to one not carried", () => {
    const inventory = new Inventory();
    inventory.addWeapon("gun");

    inventory.switchCurrentWeapon("bow");

    expect(inventory.getCurrentWeaponId()).toBe("gun");
  });

  it("has no current weapon when empty", () => {
    const inventory = new Inventory();

    expect(inventory.hasAtLeastOneRangeWeapon()).toBe(false);
    expect(inventory.getCurrentWeaponId()).toBeNull();
    expect(() => inventory.switchToNextWeapon()).not.toThrow();
  });

  it("restores from a snapshot and ignores invalid data", () => {
    const inventory = new Inventory();

    inventory.restore({
      powerUps: { [PowerUps.DASH]: Switch.ENABLE, torch: "bogus" } as never,
      weapons: ["bow", "laser", "bow", "gun"] as never,
      activeWeapon: 99,
    });

    expect(inventory.equip(PowerUps.DASH)).toBe(true);
    // invalid value falls back to the default
    expect(inventory.equip(PowerUps.TORCH)).toBe(true);
    expect(inventory.getWeaponIds()).toEqual(["bow", "gun"]);
    expect(inventory.getCurrentWeaponId()).toBe("bow");
  });
});
