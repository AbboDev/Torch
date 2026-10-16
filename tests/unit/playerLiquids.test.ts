import { describe, expect, it, vi } from "vitest";
import { Defense, NO_DEFENSE } from "@/combat/damage";
import { LIQUID_EFFECTS, LIQUID_TICK } from "@/config/liquids";
import {
  DamageTimer,
  DamageTimerConfig,
  LiquidDetection,
  PlayerLiquids,
} from "@/entities/player/PlayerLiquids";

function setup(defense: Defense = NO_DEFENSE) {
  let detection: LiquidDetection = { swimming: false, liquid: null };

  const stats = { battery: 50, life: 99 };
  const target = {
    getDefense: () => defense,
    takeDamage: (amount: number) => {
      stats.life -= amount;
    },
  };
  const sprite = {
    isTinted: false,
    clearTint: vi.fn(() => {
      sprite.isTinted = false;
    }),
    setTint: vi.fn(() => {
      sprite.isTinted = true;
    }),
  };

  const timers: (DamageTimer & { config: DamageTimerConfig })[] = [];
  const addTimer = vi.fn((config: DamageTimerConfig) => {
    const timer = {
      config,
      paused: false,
      reset: vi.fn((next: DamageTimerConfig) => {
        timer.config = next;
      }),
    };
    timers.push(timer);

    return timer;
  });

  const liquids = new PlayerLiquids(
    () => detection,
    addTimer,
    stats,
    target,
    sprite
  );

  return {
    liquids,
    stats,
    sprite,
    timers,
    addTimer,
    set: (next: LiquidDetection) => (detection = next),
    tick: () => timers[0].config.callback(),
  };
}

describe("PlayerLiquids", () => {
  it("is not swimming outside of the liquids, and starts no timer", () => {
    const { liquids, addTimer } = setup();

    liquids.update();

    expect(liquids.isSwimming).toBe(false);
    expect(addTimer).not.toHaveBeenCalled();
  });

  it("swims in water without being hurt", () => {
    const { liquids, set, addTimer } = setup();
    set({ swimming: true, liquid: "water" });

    liquids.update();

    expect(liquids.isSwimming).toBe(true);
    expect(addTimer).not.toHaveBeenCalled();
  });

  it("swims in a liquid with no name", () => {
    const { liquids, set } = setup();
    set({ swimming: true, liquid: null });

    liquids.update();

    expect(liquids.isSwimming).toBe(true);
  });

  it("is hurt by acid at every tick: life, battery and a flash of color", () => {
    const { liquids, set, stats, sprite, addTimer, tick } = setup();
    set({ swimming: true, liquid: "acid" });

    liquids.update();
    liquids.update();
    expect(addTimer).toHaveBeenCalledTimes(1);
    expect(addTimer.mock.calls[0][0].delay).toBe(LIQUID_TICK);

    tick();
    expect(stats).toEqual({ life: 96, battery: 48 });
    expect(sprite.setTint).toHaveBeenCalledWith(
      0x00ff00,
      0xff00ff,
      0x00ff00,
      undefined
    );

    // the next tick, the color is cleared
    tick();
    expect(sprite.clearTint).toHaveBeenCalledTimes(1);
    expect(stats).toEqual({ life: 93, battery: 46 });
  });

  it("is hurt by lava in the life only", () => {
    const { liquids, set, stats, tick } = setup();
    set({ swimming: true, liquid: "lava" });

    liquids.update();
    tick();

    expect(stats).toEqual({ life: 97, battery: 50 });
  });

  it("stops the damage when out of the liquid, and clears the color", () => {
    const { liquids, set, sprite, timers, tick } = setup();
    set({ swimming: true, liquid: "acid" });
    liquids.update();
    tick();
    expect(sprite.isTinted).toBe(true);

    set({ swimming: false, liquid: null });
    liquids.update();

    expect(timers[0].paused).toBe(true);
    expect(sprite.isTinted).toBe(false);
  });

  it("starts the damage again on coming back, with the new liquid", () => {
    const { liquids, set, timers, stats } = setup();
    set({ swimming: true, liquid: "acid" });
    liquids.update();
    set({ swimming: false, liquid: null });
    liquids.update();

    set({ swimming: true, liquid: "lava" });
    liquids.update();

    expect(timers).toHaveLength(1);
    expect(timers[0].reset).toHaveBeenCalledTimes(1);
    expect(timers[0].paused).toBe(false);

    timers[0].config.callback();
    expect(stats).toEqual({ life: 97, battery: 50 });
  });

  it("stops the damage when going from acid into water", () => {
    const { liquids, set, timers } = setup();
    set({ swimming: true, liquid: "acid" });
    liquids.update();

    set({ swimming: true, liquid: "water" });
    liquids.update();

    expect(liquids.isSwimming).toBe(true);
    expect(timers[0].paused).toBe(true);
  });

  it("is not fooled by a name which is a property of every object", () => {
    const { liquids, set, addTimer } = setup();
    set({ swimming: true, liquid: "toString" });

    liquids.update();

    expect(addTimer).not.toHaveBeenCalled();
  });

  it("has the damage of the two liquids which hurt", () => {
    expect(Object.keys(LIQUID_EFFECTS)).toEqual(["acid", "lava"]);
  });

  it("takes the damage of the liquids as damage of a kind: lava is fire, acid is acid", () => {
    expect(LIQUID_EFFECTS.lava.damage.kind).toBe("fire");
    expect(LIQUID_EFFECTS.acid.damage.kind).toBe("acid");
  });

  it("is not hurt by lava in the life, with a protection from fire", () => {
    const suit: Defense = { protections: new Set(["fire"]), resistances: {} };
    const { liquids, stats, set, tick } = setup(suit);

    set({ swimming: true, liquid: "lava" });
    liquids.update();
    tick();

    expect(stats.life).toBe(99);
  });

  it("is hurt less by acid with a resistance, and the battery is drained as before", () => {
    const armor: Defense = {
      protections: new Set(),
      resistances: { acid: 0.5 },
    };
    const { liquids, stats, set, tick } = setup(armor);

    set({ swimming: true, liquid: "acid" });
    liquids.update();
    tick();

    expect(stats.life).toBeCloseTo(99 - 1.5);
    expect(stats.battery).toBe(48);
  });

  it("is not protected from the acid by a protection from fire", () => {
    const suit: Defense = { protections: new Set(["fire"]), resistances: {} };
    const { liquids, stats, set, tick } = setup(suit);

    set({ swimming: true, liquid: "acid" });
    liquids.update();
    tick();

    expect(stats.life).toBe(96);
  });
});
