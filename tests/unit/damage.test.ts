import { describe, expect, it, vi } from "vitest";
import {
  DamageKind,
  DamageSource,
  Defense,
  NO_DEFENSE,
  applyDamage,
  combineDefenses,
  getDamage,
} from "@/combat/damage";

const defense = (
  protections: DamageKind[] = [],
  resistances: Defense["resistances"] = {}
): Defense => ({ protections: new Set(protections), resistances });

const corruption: DamageSource = {
  kind: "corruption",
  amount: 5,
  protectedAmount: 1,
};

describe("getDamage", () => {
  it("is the amount of the source for an entity with no defense", () => {
    expect(getDamage(corruption)).toBe(5);
    expect(getDamage(corruption, NO_DEFENSE)).toBe(5);
  });

  it("is the protected amount for an entity protected from the kind", () => {
    expect(getDamage(corruption, defense(["corruption"]))).toBe(1);
  });

  it("is nothing for a protected entity if the source has no protected amount", () => {
    const lava: DamageSource = { kind: "fire", amount: 2 };

    expect(getDamage(lava, defense(["fire"]))).toBe(0);
  });

  it("is not changed by a protection from another kind", () => {
    expect(getDamage(corruption, defense(["fire", "acid"]))).toBe(5);
  });

  it("is smaller with a resistance, protected or not", () => {
    expect(getDamage(corruption, defense([], { corruption: 0.4 }))).toBeCloseTo(
      3
    );
    expect(
      getDamage(corruption, defense(["corruption"], { corruption: 0.5 }))
    ).toBeCloseTo(0.5);
  });

  it("takes only the resistance of the kind", () => {
    expect(getDamage(corruption, defense([], { fire: 1 }))).toBe(5);
  });

  it("is nothing with the whole kind stopped", () => {
    expect(getDamage(corruption, defense([], { corruption: 1 }))).toBe(0);
  });

  it("does not let a resistance out of range heal or hurt more", () => {
    expect(getDamage(corruption, defense([], { corruption: 3 }))).toBe(0);
    expect(getDamage(corruption, defense([], { corruption: -2 }))).toBe(5);
  });

  it("is never negative or not a number, whatever the source says", () => {
    expect(getDamage({ kind: "physical", amount: -4 })).toBe(0);
    expect(getDamage({ kind: "physical", amount: Number.NaN })).toBe(0);
    expect(getDamage({ kind: "physical", amount: Infinity })).toBe(0);
  });

  it("works the same for every kind", () => {
    for (const kind of ["physical", "fire", "acid", "heat", "toxic"] as const) {
      expect(getDamage({ kind, amount: 4 }, defense([], { [kind]: 0.25 }))).toBe(3);
    }
  });
});

describe("combineDefenses", () => {
  it("is no defense with nothing to put together", () => {
    const none = combineDefenses();

    expect(none.protections.size).toBe(0);
    expect(none.resistances).toEqual({});
  });

  it("protects from all the kinds of every defense", () => {
    const both = combineDefenses(defense(["fire"]), defense(["acid", "fire"]));

    expect([...both.protections].sort()).toEqual(["acid", "fire"]);
  });

  it("adds the resistances up, without passing 1", () => {
    const armor = defense([], { physical: 0.5, fire: 0.2 });
    const shield = defense([], { physical: 0.5 });
    const both = combineDefenses(armor, shield);

    expect(both.resistances.physical).toBeCloseTo(0.75);
    expect(both.resistances.fire).toBeCloseTo(0.2);
    expect(both.resistances.acid).toBeUndefined();
    expect(
      combineDefenses(defense([], { heat: 0.9 }), defense([], { heat: 0.9 }))
        .resistances.heat
    ).toBeLessThan(1);
  });

  it("does not change the defenses it is given", () => {
    const armor = defense(["fire"], { physical: 0.5 });
    combineDefenses(armor, defense(["acid"], { physical: 0.5 }));

    expect([...armor.protections]).toEqual(["fire"]);
    expect(armor.resistances).toEqual({ physical: 0.5 });
  });

  it("gives the same damage as the defenses one after the other would", () => {
    const suit = defense(["corruption"]);
    const armor = defense([], { corruption: 0.5 });

    expect(getDamage(corruption, combineDefenses(suit, armor))).toBeCloseTo(0.5);
  });
});

describe("applyDamage", () => {
  const target = (given: Defense = NO_DEFENSE) => ({
    getDefense: () => given,
    takeDamage: vi.fn(),
  });

  it("hurts the target by what getDamage says, and tells how much", () => {
    const hurt = target(defense(["corruption"]));

    expect(applyDamage(hurt, corruption)).toBe(1);
    expect(hurt.takeDamage).toHaveBeenCalledWith(1, corruption);
  });

  it("does not touch a target which takes no damage", () => {
    const safe = target(defense(["fire"]));

    expect(applyDamage(safe, { kind: "fire", amount: 3 })).toBe(0);
    expect(safe.takeDamage).not.toHaveBeenCalled();
  });

  it("works with any kind of target: the same rules for all", () => {
    let playerLife = 100;
    let enemyLife = 10;
    const player = {
      getDefense: () => NO_DEFENSE,
      takeDamage: (amount: number) => (playerLife -= amount),
    };
    const enemy = {
      getDefense: () => defense([], { physical: 0.5 }),
      takeDamage: (amount: number) => (enemyLife -= amount),
    };
    const shot: DamageSource = { kind: "physical", amount: 4 };

    applyDamage(player, shot);
    applyDamage(enemy, shot);

    expect(playerLife).toBe(96);
    expect(enemyLife).toBe(8);
  });
});
