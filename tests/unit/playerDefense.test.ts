import { describe, expect, it } from "vitest";
import { getPlayerDefense } from "@/combat/playerDefense";
import { PowerUps } from "@/miscellaneous/Inventory";

describe("getPlayerDefense", () => {
  const protections = {
    [PowerUps.FAN]: ["acid"],
    [PowerUps.BOOTS]: ["fire", "heat"],
  } as const;

  it("is protected from nothing with no power-up which protects", () => {
    expect(getPlayerDefense(() => true).protections.size).toBe(0);
  });

  it("is protected from what the power-ups it has equipped protect from", () => {
    const defense = getPlayerDefense(
      (item) => item === PowerUps.BOOTS,
      protections
    );

    expect([...defense.protections].sort()).toEqual(["fire", "heat"]);
  });

  it("is protected from the kinds of all the power-ups it has", () => {
    const defense = getPlayerDefense(() => true, protections);

    expect([...defense.protections].sort()).toEqual(["acid", "fire", "heat"]);
  });

  it("does not take the protection of a power-up it has not equipped", () => {
    expect(getPlayerDefense(() => false, protections).protections.size).toBe(0);
  });

  it("has no resistance: that is for the armor and the shield", () => {
    expect(getPlayerDefense(() => true, protections).resistances).toEqual({});
  });
});
