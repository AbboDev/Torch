import { describe, expect, it } from "vitest";
import { applyDamage, NO_DEFENSE } from "@/combat/damage";
import { Health } from "@/combat/Health";
import { ENEMY_DEFINITIONS, ENEMY_KINDS, EnemyDefinition } from "@/config/enemies";
import { WEAPON_DAMAGE } from "@/config/weapons";
import { WEAPON_IDS } from "@/miscellaneous/Inventory";

/** How many shots of a weapon it takes to kill an enemy of a kind, or null if never */
function shotsToKill(
  kind: (typeof ENEMY_KINDS)[number],
  weapon: (typeof WEAPON_IDS)[number]
): number | null {
  const definition = ENEMY_DEFINITIONS[kind] as EnemyDefinition;
  const health = new Health(definition.life, definition.defense ?? NO_DEFENSE);

  for (let shots = 1; shots <= 1000; shots++) {
    applyDamage(health, WEAPON_DAMAGE[weapon]);

    if (health.isDead) {
      return shots;
    }
  }

  return null;
}

describe("the enemies and the weapons", () => {
  it("can be killed by every weapon: a defense which stops it all is a mistake", () => {
    for (const kind of ENEMY_KINDS) {
      for (const weapon of WEAPON_IDS) {
        expect(shotsToKill(kind, weapon), `${kind} and ${weapon}`).not.toBeNull();
      }
    }
  });

  it("is killed by fewer shots of a stronger weapon", () => {
    for (const kind of ENEMY_KINDS) {
      const gun = shotsToKill(kind, "gun") as number;
      const rifle = shotsToKill(kind, "rifle") as number;

      expect(rifle).toBeLessThanOrEqual(gun);
    }
  });

  it("takes more than one shot of the gun to kill a walker, and it does not take a hundred", () => {
    const shots = shotsToKill("walker", "gun") as number;

    expect(shots).toBeGreaterThan(1);
    expect(shots).toBeLessThan(100);
  });
});
