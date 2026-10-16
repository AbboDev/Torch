/** Milliseconds without using the battery before it starts recharging */
export const RECHARGE_WAIT = 5000;

/** Milliseconds between one unit of battery and the next while recharging */
export const RECHARGE_STEP = 100;

/** The part of a Phaser timer which the recharge uses */
export interface TimerLike {
  getProgress(): number;
  destroy(): void;
  remove(): void;
}

/** The part of the clock of a Phaser scene which the recharge uses */
export interface ClockLike {
  delayedCall(delay: number, callback: () => void): TimerLike;
  addEvent(config: {
    delay: number;
    loop: boolean;
    callback: () => void;
  }): TimerLike;
}

/**
 * Fills the battery up again: after the Player has not used it for a while,
 * one unit at a time until it is full.
 */
export class BatteryRecharger {
  /** The level of the battery at the end of the last frame */
  private lastBattery = 0;

  /** The wait after which the battery starts recharging */
  private waitTimer?: TimerLike;

  /** The timer which fills the battery up */
  private rechargeTimer?: TimerLike;

  public constructor(
    private readonly clock: ClockLike,
    private readonly hasBattery: () => boolean,
    private readonly stats: { battery: number; readonly maxBattery: number }
  ) {}

  /** Call it every frame */
  public update(): void {
    // The Player should have at least the battery powerup
    if (!this.hasBattery()) {
      return;
    }

    // Full already (a save point can fill it while a recharge is running):
    // stop, or the timer keeps adding units past the maximum
    if (this.stats.battery >= this.stats.maxBattery) {
      this.stats.battery = this.stats.maxBattery;
      this.stopTimers();

      return;
    }

    // Check if the wait was not started, or if it is over
    const canWaitStart: boolean =
      !this.waitTimer || this.waitTimer.getProgress() === 1;

    // Check if the recharge was not started, or if it is over
    const canRechargeStart: boolean =
      !this.rechargeTimer || this.rechargeTimer.getProgress() === 1;

    // If the Player use the battery, restart the wait
    const isUsed: boolean = this.stats.battery < this.lastBattery;

    if (isUsed) {
      this.stopTimers();
    }

    if ((canWaitStart && canRechargeStart) || isUsed) {
      this.waitTimer = this.clock.delayedCall(RECHARGE_WAIT, () => {
        // Start the recharge only after a certain amount of time
        this.rechargeTimer = this.clock.addEvent({
          delay: RECHARGE_STEP,
          loop: true,
          callback: () => {
            // The clock can fire this before update sees the battery was filled
            if (this.stats.battery < this.stats.maxBattery) {
              ++this.stats.battery;
            }

            if (this.stats.battery >= this.stats.maxBattery) {
              this.stopTimers();
            }
          },
        });
      });
    }
  }

  /** Call it at the end of every frame: the battery used is seen in the next */
  public remember(): void {
    this.lastBattery = this.stats.battery;
  }

  /** The wait and the recharge are over: drop both, so a later use can start again */
  private stopTimers(): void {
    this.waitTimer?.destroy();
    this.waitTimer?.remove();
    this.rechargeTimer?.destroy();
    this.rechargeTimer?.remove();
    this.waitTimer = undefined;
    this.rechargeTimer = undefined;
  }
}
