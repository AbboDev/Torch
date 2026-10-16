import { describe, expect, it } from "vitest";
import {
  DamageSource,
  Defense,
  NO_DEFENSE,
  getDamage,
} from "@/combat/damage";
import { getZoneDamageSource } from "@/combat/zones";
import { DAMAGE_AMOUNTS } from "@/config/damage";
import { Darkness, DarknessType } from "@/world/darkness";

/** An entity with the right power-up: protected from the corruption */
const protectedFromCorruption: Defense = {
  protections: new Set(["corruption"]),
  resistances: {},
};

/** The source of a zone which does harm */
function harm(level: DarknessType): DamageSource {
  const zone = getZoneDamageSource(level);

  if (!zone) {
    throw new Error("The zone does no harm");
  }

  return zone;
}

describe("getZoneDamageSource", () => {
  it("is nothing for the zones which do no harm", () => {
    for (const level of [Darkness.NONE, Darkness.SHADED, Darkness.DARK]) {
      expect(getZoneDamageSource(level)).toBeNull();
    }
  });

  it("is the corruption, for the zones which are corrupted", () => {
    for (const level of [
      Darkness.CORRUPTED_PARTIAL,
      Darkness.CORRUPTED_TOTAL,
    ]) {
      expect(getZoneDamageSource(level)?.kind).toBe("corruption");
    }
  });

  it("hurts a little in a partly corrupted zone, without the power-up, and not with it", () => {
    const zone = harm(Darkness.CORRUPTED_PARTIAL);

    expect(getDamage(zone, NO_DEFENSE)).toBe(DAMAGE_AMOUNTS.light);
    expect(getDamage(zone, protectedFromCorruption)).toBe(0);
  });

  it("hurts a lot in a totally corrupted zone, and a little with the power-up", () => {
    const zone = harm(Darkness.CORRUPTED_TOTAL);

    expect(getDamage(zone, NO_DEFENSE)).toBe(DAMAGE_AMOUNTS.heavy);
    expect(getDamage(zone, protectedFromCorruption)).toBe(DAMAGE_AMOUNTS.little);
  });

  it("hurts more as the zone is more corrupted, and the power-up always helps", () => {
    const partial = harm(Darkness.CORRUPTED_PARTIAL);
    const total = harm(Darkness.CORRUPTED_TOTAL);

    expect(DAMAGE_AMOUNTS.heavy).toBeGreaterThan(DAMAGE_AMOUNTS.light);
    expect(DAMAGE_AMOUNTS.light).toBeGreaterThan(DAMAGE_AMOUNTS.little);
    expect(DAMAGE_AMOUNTS.little).toBeGreaterThan(DAMAGE_AMOUNTS.none);
    expect(getDamage(total, NO_DEFENSE)).toBeGreaterThan(
      getDamage(partial, NO_DEFENSE)
    );

    for (const zone of [partial, total]) {
      expect(getDamage(zone, protectedFromCorruption)).toBeLessThan(
        getDamage(zone, NO_DEFENSE)
      );
    }
  });
});
