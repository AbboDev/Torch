import { describe, expect, it, vi } from "vitest";
import {
  DamageKind,
  DamageSource,
  Defense,
  NO_DEFENSE,
} from "@/combat/damage";
import { DamageOverTime } from "@/combat/DamageOverTime";

function setup(defense: Defense = NO_DEFENSE) {
  let source: DamageSource | null = null;
  const state = { life: 100 };
  const onHurt = vi.fn();
  const target = {
    getDefense: () => defense,
    takeDamage: (amount: number) => {
      state.life -= amount;
    },
  };
  const over = new DamageOverTime(target, () => source, 200, onHurt);

  return {
    over,
    state,
    onHurt,
    set: (next: DamageSource | null) => (source = next),
  };
}

const corruption: DamageSource = {
  kind: "corruption",
  amount: 2,
  protectedAmount: 0,
};

describe("DamageOverTime", () => {
  it("does nothing while there is nothing which hurts", () => {
    const { over, state } = setup();

    expect(over.update(1000)).toBe(0);
    expect(state.life).toBe(100);
  });

  it("hurts every tick, and not before", () => {
    const { over, state, set } = setup();
    set(corruption);

    over.update(150);
    expect(state.life).toBe(100);

    over.update(60);
    expect(state.life).toBe(98);

    over.update(200);
    expect(state.life).toBe(96);
  });

  it("keeps the time which is left after a tick", () => {
    const { over, state, set } = setup();
    set(corruption);

    over.update(150);
    over.update(150);
    over.update(150);

    // 450 ms: two ticks, 50 ms left
    expect(state.life).toBe(96);
    over.update(150);
    expect(state.life).toBe(94);
  });

  it("tells the life it took in the frame", () => {
    const { over, set } = setup();
    set(corruption);

    expect(over.update(200)).toBe(2);
    expect(over.update(50)).toBe(0);
  });

  it("hurts more than once when a frame is long, but not without limit", () => {
    const { over, state, set } = setup();
    set(corruption);

    over.update(450);
    expect(state.life).toBe(96);

    over.update(100000);
    // five ticks at most
    expect(state.life).toBe(86);
  });

  it("starts again from zero when the source stops", () => {
    const { over, state, set } = setup();
    set(corruption);
    over.update(190);

    set(null);
    over.update(500);
    set(corruption);
    over.update(190);

    expect(state.life).toBe(100);
  });

  it("hurts by the defense of the target", () => {
    const suit: Defense = {
      protections: new Set<DamageKind>(["corruption"]),
      resistances: {},
    };
    const { over, state, onHurt, set } = setup(suit);
    set({ kind: "corruption", amount: 5, protectedAmount: 1 });

    over.update(400);

    expect(state.life).toBe(98);
    expect(onHurt).toHaveBeenCalledTimes(2);
    expect(onHurt).toHaveBeenCalledWith(1, {
      kind: "corruption",
      amount: 5,
      protectedAmount: 1,
    });
  });

  it("does not call onHurt, or take life, when the target takes no damage", () => {
    const suit: Defense = {
      protections: new Set<DamageKind>(["corruption"]),
      resistances: {},
    };
    const { over, state, onHurt, set } = setup(suit);
    set(corruption);

    over.update(1000);

    expect(state.life).toBe(100);
    expect(onHurt).not.toHaveBeenCalled();
  });

  it("follows the source when it changes while the target is in it", () => {
    const { over, state, set } = setup();
    set({ kind: "corruption", amount: 1 });
    over.update(200);

    set({ kind: "corruption", amount: 4 });
    over.update(200);

    expect(state.life).toBe(95);
  });
});
