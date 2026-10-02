import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/miscellaneous/Switch", () => ({
  Switch: {
    ENABLE: "true",
    DISABLE: "false",
    INDETERMINATE: "null",
  },
}));

describe("inventory integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("updates power-ups and notifies the scene when a weapon is added", async () => {
    const { Inventory, PowerUps } = await import("@/miscellaneous/Inventory");
    const sceneEvents = { emit: vi.fn() };
    const inventory = Inventory.getInstance({ events: sceneEvents } as never);

    expect(inventory.equip(PowerUps.DASH)).toBe(false);
    inventory.invertStatus(PowerUps.DASH);
    expect(inventory.equip(PowerUps.DASH)).toBe(true);

    const weapon = { canShoot: vi.fn() };
    inventory.pushWeapon(weapon as never);

    expect(inventory.getCurrentWeapon()).toBe(weapon);
    expect(sceneEvents.emit).toHaveBeenCalledWith("changedWeapon", weapon);
  });
});
