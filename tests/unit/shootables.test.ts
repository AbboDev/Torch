import { describe, expect, it } from "vitest";
import { Defense } from "@/combat/damage";
import { WEAPON_DAMAGE } from "@/config/weapons";
import { WEAPON_IDS } from "@/miscellaneous/Inventory";
import { Shootable, Shootables } from "@/world/shootables";

/** An enemy of 10 x 10 pixels at (x, y) */
const enemy = (id: string, x: number, y: number): Shootable => ({
  id,
  contains: (px, py) => px >= x && px < x + 10 && py >= y && py < y + 10,
  position: () => ({ x: x + 5, y: y + 5 }),
});

describe("Shootables", () => {
  it("finds nothing when it is empty", () => {
    expect(new Shootables().find(10, 10)).toBeNull();
  });

  it("finds the thing which is at the point", () => {
    const shootables = new Shootables();
    const first = enemy("first", 10, 10);
    shootables.add(first);
    shootables.add(enemy("second", 100, 10));

    expect(shootables.find(15, 15)).toBe(first);
    expect(shootables.find(105, 15)?.id).toBe("second");
    expect(shootables.find(50, 15)).toBeNull();
  });

  it("forgets a thing when it goes away", () => {
    const shootables = new Shootables();
    const remove = shootables.add(enemy("gone", 0, 0));
    expect(shootables.find(1, 1)?.id).toBe("gone");

    remove();

    expect(shootables.find(1, 1)).toBeNull();
  });
});

describe("Shootables: the positions", () => {
  it("tells where the things are, and leaves out the ones with none", () => {
    const shootables = new Shootables();
    shootables.add(enemy("a", 10, 10));
    shootables.add({ id: "gone", contains: () => false, position: () => null });
    shootables.add(enemy("b", 100, 20));

    expect(shootables.positions()).toEqual([
      { x: 15, y: 15 },
      { x: 105, y: 25 },
    ]);
  });
});

describe("Shootables: the hits", () => {
  /** An enemy of 10 x 10 pixels at (x, y) with life and a defense */
  const enemyWithLife = (life: number, defense: Defense) => {
    const state = { life };
    const thing: Shootable = {
      ...enemy("e", 0, 0),
      target: {
        getDefense: () => defense,
        takeDamage: (amount: number) => {
          state.life -= amount;
        },
      },
    };

    return { state, thing };
  };
  const none: Defense = { protections: new Set(), resistances: {} };

  it("hurts the thing which is at the point, by its defense", () => {
    const shootables = new Shootables();
    const { state, thing } = enemyWithLife(10, {
      protections: new Set(),
      resistances: { physical: 0.5 },
    });
    shootables.add(thing);

    expect(shootables.hit(5, 5, { kind: "physical", amount: 4 })).toBe(2);
    expect(state.life).toBe(8);
  });

  it("does not hurt what is not at the point", () => {
    const shootables = new Shootables();
    const { state, thing } = enemyWithLife(10, none);
    shootables.add(thing);

    expect(shootables.hit(50, 50, { kind: "physical", amount: 4 })).toBe(0);
    expect(state.life).toBe(10);
  });

  it("does not hurt a thing which has no life to take", () => {
    const shootables = new Shootables();
    shootables.add(enemy("rock", 0, 0));

    expect(shootables.hit(5, 5, { kind: "physical", amount: 4 })).toBe(0);
  });

  it("is hurt by the shots of every weapon", () => {
    for (const id of WEAPON_IDS) {
      const shootables = new Shootables();
      const { state, thing } = enemyWithLife(100, none);
      shootables.add(thing);

      shootables.hit(5, 5, WEAPON_DAMAGE[id]);

      expect(state.life).toBe(100 - WEAPON_DAMAGE[id].amount);
    }
  });
});

describe("WEAPON_DAMAGE", () => {
  it("has a source for every weapon, which hurts", () => {
    for (const id of WEAPON_IDS) {
      expect(WEAPON_DAMAGE[id].amount).toBeGreaterThan(0);
      expect(WEAPON_DAMAGE[id].kind).toBe("physical");
    }
  });
});
