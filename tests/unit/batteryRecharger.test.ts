import { describe, expect, it } from "vitest";
import {
  BatteryRecharger,
  ClockLike,
  RECHARGE_STEP,
  RECHARGE_WAIT,
  TimerLike,
} from "@/entities/player/BatteryRecharger";

class FakeTimer implements TimerLike {
  public elapsed = 0;
  public done = false;
  public removed = false;

  public constructor(
    public readonly delay: number,
    public readonly callback: () => void,
    public readonly loop: boolean
  ) {}

  public getProgress(): number {
    if (this.loop) {
      return Math.min(this.elapsed / this.delay, 0.99);
    }

    return this.done ? 1 : this.elapsed / this.delay;
  }

  public destroy(): void {
    this.removed = true;
  }

  public remove(): void {
    this.removed = true;
  }
}

class FakeClock implements ClockLike {
  public timers: FakeTimer[] = [];
  public delayedCalls = 0;

  public delayedCall(delay: number, callback: () => void): TimerLike {
    this.delayedCalls++;

    return this.add(new FakeTimer(delay, callback, false));
  }

  public addEvent(config: {
    delay: number;
    loop: boolean;
    callback: () => void;
  }): TimerLike {
    return this.add(new FakeTimer(config.delay, config.callback, config.loop));
  }

  public advance(milliseconds: number): void {
    for (const timer of [...this.timers]) {
      if (timer.removed || (timer.done && !timer.loop)) {
        continue;
      }

      timer.elapsed += milliseconds;

      while (timer.elapsed >= timer.delay && !timer.removed) {
        timer.callback();

        if (!timer.loop) {
          timer.done = true;
          break;
        }

        timer.elapsed -= timer.delay;
      }
    }
  }

  private add(timer: FakeTimer): FakeTimer {
    this.timers.push(timer);

    return timer;
  }
}

function setup(battery = 50, owned = true) {
  const clock = new FakeClock();
  const stats = { battery, maxBattery: 99 };
  const recharger = new BatteryRecharger(clock, () => owned, stats);

  /** Frames of 16 ms: update, time goes on, remember */
  const run = (seconds: number) => {
    for (let frame = 0; frame < (seconds * 1000) / 16; frame++) {
      recharger.update();
      clock.advance(16);
      recharger.remember();
    }
  };

  return { clock, stats, recharger, run };
}

describe("BatteryRecharger", () => {
  it("does nothing without the battery power-up", () => {
    const { stats, run, clock } = setup(50, false);

    run(10);

    expect(stats.battery).toBe(50);
    expect(clock.timers).toHaveLength(0);
  });

  it("does nothing when the battery is full", () => {
    const { stats, run, clock } = setup(99);

    run(10);

    expect(stats.battery).toBe(99);
    expect(clock.timers).toHaveLength(0);
  });

  it("waits before recharging, then fills up one unit at a time", () => {
    const { stats, run } = setup();

    run(RECHARGE_WAIT / 1000 - 0.5);
    expect(stats.battery).toBe(50);

    // 8 seconds in all: 3 seconds of recharge, 30 units
    run(3.5);
    expect(stats.battery).toBeGreaterThan(70);
    expect(stats.battery).toBeLessThan(85);
  });

  it("stops at the maximum", () => {
    const { stats, run } = setup(95);

    run(RECHARGE_WAIT / 1000 + (4 * RECHARGE_STEP) / 1000 + 3);

    expect(stats.battery).toBe(99);
  });

  it("does not keep charging after the battery was filled up", () => {
    const { stats, clock, run } = setup(90);

    run(RECHARGE_WAIT / 1000 + 0.5);
    expect(stats.battery).toBeGreaterThan(90);
    expect(stats.battery).toBeLessThan(99);

    // A save point fills it while the recharge timer is still running.
    // The clock fires before the next update, as Phaser does.
    stats.battery = stats.maxBattery;
    clock.advance(RECHARGE_STEP * 5);

    expect(stats.battery).toBe(99);
  });

  it("pulls a battery that already passed the maximum back to it", () => {
    const { stats, recharger } = setup(120);

    recharger.update();

    expect(stats.battery).toBe(99);
  });

  it("does not start a new wait at every frame", () => {
    const { clock, run } = setup();

    run(1);

    expect(clock.delayedCalls).toBe(1);
  });

  it("starts the wait again when the battery is used", () => {
    const { stats, run, recharger } = setup();
    run(RECHARGE_WAIT / 1000 + 2);
    const recharged = stats.battery;
    expect(recharged).toBeGreaterThan(50);

    // the Player uses the battery: nothing grows for the whole wait
    stats.battery -= 10;
    recharger.update();
    const afterUse = stats.battery;

    run(RECHARGE_WAIT / 1000 - 0.5);
    expect(stats.battery).toBe(afterUse);

    run(2);
    expect(stats.battery).toBeGreaterThan(afterUse);
  });
});
