import { describe, expect, it } from "vitest";
import { Damageable, combineDefenses, getDamage } from "@/combat/damage";
import { DamageOverTime } from "@/combat/DamageOverTime";
import { getPlayerDefense } from "@/combat/playerDefense";
import { getZoneDamageSource } from "@/combat/zones";
import { DAMAGE_AMOUNTS, ZONE_TICK } from "@/config/damage";
import { Darkness, DarknessType } from "@/world/darkness";
import { PowerUps } from "@/miscellaneous/Inventory";

// The Player in a corrupted zone, as the game puts it together: the zone gives
// the source, the equipped power-ups give the defense, and the time gives the ticks
function play(level: DarknessType, equipped: PowerUps[], seconds: number) {
  const player = { life: 100 };
  const target: Damageable = {
    getDefense: () =>
      getPlayerDefense((item) => equipped.includes(item), {
        [PowerUps.FAN]: ["corruption"],
      }),
    takeDamage: (amount) => {
      player.life -= amount;
    },
  };
  const zone = new DamageOverTime(target, () => getZoneDamageSource(level));

  for (let elapsed = 0; elapsed < seconds * 1000; elapsed += 20) {
    zone.update(20);
  }

  return player.life;
}

const ticks = (seconds: number) => Math.floor((seconds * 1000) / ZONE_TICK);

describe("a zone which is corrupted, with the Player in it", () => {
  it("does no harm in the zones which are not", () => {
    for (const level of [Darkness.NONE, Darkness.SHADED, Darkness.DARK]) {
      expect(play(level, [], 10)).toBe(100);
    }
  });

  it("hurts a little in a partly corrupted zone, without the power-up", () => {
    expect(play(Darkness.CORRUPTED_PARTIAL, [], 2)).toBe(
      100 - ticks(2) * DAMAGE_AMOUNTS.light
    );
  });

  it("does not hurt in a partly corrupted zone, with the power-up", () => {
    expect(play(Darkness.CORRUPTED_PARTIAL, [PowerUps.FAN], 10)).toBe(100);
  });

  it("hurts a lot in a totally corrupted zone, without the power-up", () => {
    expect(play(Darkness.CORRUPTED_TOTAL, [], 2)).toBe(
      100 - ticks(2) * DAMAGE_AMOUNTS.heavy
    );
  });

  it("hurts a little in a totally corrupted zone, with the power-up", () => {
    expect(play(Darkness.CORRUPTED_TOTAL, [PowerUps.FAN], 2)).toBe(
      100 - ticks(2) * DAMAGE_AMOUNTS.little
    );
  });

  it("is not helped by a power-up which protects from something else", () => {
    const life = play(Darkness.CORRUPTED_TOTAL, [PowerUps.BOOTS], 1);

    expect(life).toBe(100 - ticks(1) * DAMAGE_AMOUNTS.heavy);
  });

  it("hurts less with an armor on top of the power-up", () => {
    const suit = getPlayerDefense((item) => item === PowerUps.FAN, {
      [PowerUps.FAN]: ["corruption"],
    });
    const armor = { protections: new Set<never>(), resistances: { corruption: 0.5 } };
    const zone = getZoneDamageSource(Darkness.CORRUPTED_TOTAL);

    expect(zone).not.toBeNull();
    // what the zone takes from who has the power-up, and half of it with the armor
    expect(zone && getDamage(zone, combineDefenses(suit, armor))).toBeCloseTo(
      DAMAGE_AMOUNTS.little / 2
    );
  });
});
