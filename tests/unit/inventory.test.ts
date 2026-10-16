import { describe, expect, it } from "vitest";
import { Inventory, PowerUps } from "@/miscellaneous/Inventory";
import { Switch } from "@/miscellaneous/Switch";

describe("Inventory", () => {
  it("starts with the battery only", () => {
    const inventory = new Inventory();

    expect(inventory.has(PowerUps.TORCH)).toBe(false);
    expect(inventory.has(PowerUps.HOOK)).toBe(false);
    expect(inventory.hasBattery()).toBe(true);
    expect(inventory.has(PowerUps.DASH)).toBe(false);
  });

  it("does not own the power-ups it has not found yet", () => {
    const inventory = new Inventory();

    expect(inventory.get(PowerUps.DASH)).toBe(Switch.INDETERMINATE);
    expect(inventory.get(PowerUps.TORCH)).toBe(Switch.INDETERMINATE);
  });

  it("cannot turn on a power-up which is not owned", () => {
    const inventory = new Inventory();

    expect(inventory.invertStatus(PowerUps.DASH)).toBe(Switch.INDETERMINATE);
    expect(inventory.equip(PowerUps.DASH)).toBe(false);
  });

  it("keeps the status of a power-up already owned when granted again", () => {
    const inventory = new Inventory();

    inventory.grant(PowerUps.DASH);
    inventory.invertStatus(PowerUps.DASH);
    inventory.grant(PowerUps.DASH);

    expect(inventory.get(PowerUps.DASH)).toBe(Switch.DISABLE);
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
    // invalid value falls back to the default: not owned
    expect(inventory.get(PowerUps.TORCH)).toBe(Switch.INDETERMINATE);
    expect(inventory.getWeaponIds()).toEqual(["bow", "gun"]);
    expect(inventory.getCurrentWeaponId()).toBe("bow");
  });
});
