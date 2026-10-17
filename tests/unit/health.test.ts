import { describe, expect, it, vi } from "vitest";
import { Cooldown } from "@/combat/Cooldown";
import { Defense, applyDamage } from "@/combat/damage";
import { Health } from "@/combat/Health";

describe("Health", () => {
  it("starts with all its life", () => {
    const health = new Health(10);

    expect(health.life).toBe(10);
    expect(health.isDead).toBe(false);
  });

  it("loses life with the damage", () => {
    const health = new Health(10);

    health.takeDamage(3);

    expect(health.life).toBe(7);
  });

  it("dies when the life is over, and calls onDeath once", () => {
    const onDeath = vi.fn();
    const health = new Health(5, undefined, onDeath);

    health.takeDamage(5);
    health.takeDamage(5);

    expect(health.isDead).toBe(true);
    expect(health.life).toBe(0);
    expect(onDeath).toHaveBeenCalledTimes(1);
  });

  it("does not go below zero", () => {
    const health = new Health(3);

    health.takeDamage(100);

    expect(health.life).toBe(0);
  });

  it("is hurt by the rules of the damage, as the Player is", () => {
    const armor: Defense = {
      protections: new Set(),
      resistances: { physical: 0.5 },
    };
    const health = new Health(10, armor);

    expect(applyDamage(health, { kind: "physical", amount: 4 })).toBe(2);
    expect(health.life).toBe(8);

    const suit: Defense = { protections: new Set(["fire"]), resistances: {} };
    const safe = new Health(10, suit);

    expect(applyDamage(safe, { kind: "fire", amount: 4 })).toBe(0);
    expect(safe.life).toBe(10);
  });
});

describe("Cooldown", () => {
  it("can be used the first time", () => {
    expect(new Cooldown(500).tryUse(0)).toBe(true);
  });

  it("can not be used again until the time has passed", () => {
    const cooldown = new Cooldown(500);

    expect(cooldown.tryUse(1000)).toBe(true);
    expect(cooldown.tryUse(1200)).toBe(false);
    expect(cooldown.tryUse(1499)).toBe(false);
    expect(cooldown.tryUse(1500)).toBe(true);
  });

  it("starts the time from the use, not from the try", () => {
    const cooldown = new Cooldown(500);

    cooldown.tryUse(1000);
    cooldown.tryUse(1400);

    expect(cooldown.tryUse(1500)).toBe(true);
  });
});
