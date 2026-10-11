import { LIQUID_EFFECTS, LIQUID_TICK, LiquidEffect } from "@/config/liquids";

/** What is around the Player: is it in a liquid, and which one */
export interface LiquidDetection {
  swimming: boolean;
  /** The "liquid" property of the tile, if it has one */
  liquid: string | null;
}

/** The part of a Phaser timer which the damage uses */
export interface DamageTimer {
  paused: boolean;
  reset(config: DamageTimerConfig): void;
}

export interface DamageTimerConfig {
  startAt: number;
  delay: number;
  loop: boolean;
  callback: () => void;
}

/** The part of the sprite of the Player which flashes */
export interface Tintable {
  readonly isTinted: boolean;
  clearTint(): unknown;
  setTint(
    topLeft?: number,
    topRight?: number,
    bottomLeft?: number,
    bottomRight?: number
  ): unknown;
}

/**
 * The Player in a liquid: it swims, and acid and lava hurt it every
 * little while while its sprite flashes.
 */
export class PlayerLiquids {
  /** The Player is in a liquid */
  public isSwimming = false;

  /** The timer which applies the damage, once it was needed */
  private damageTimer?: DamageTimer;

  public constructor(
    private readonly detect: () => LiquidDetection,
    private readonly addTimer: (config: DamageTimerConfig) => DamageTimer,
    private readonly stats: { battery: number; life: number },
    private readonly sprite: Tintable
  ) {}

  /** Call it every frame */
  public update(): void {
    const { swimming, liquid } = this.detect();

    this.isSwimming = swimming;

    const effect =
      swimming && liquid && Object.hasOwn(LIQUID_EFFECTS, liquid)
        ? LIQUID_EFFECTS[liquid]
        : null;

    if (effect) {
      const config: DamageTimerConfig = {
        startAt: 0,
        delay: LIQUID_TICK,
        loop: true,
        callback: () => this.hurt(effect),
      };

      if (!this.damageTimer) {
        this.damageTimer = this.addTimer(config);
      } else if (this.damageTimer.paused) {
        this.damageTimer.reset(config);
        this.damageTimer.paused = false;
      }
    } else if (this.damageTimer) {
      // Out of the liquid, or in one which does no harm
      this.damageTimer.paused = true;

      if (this.sprite.isTinted) {
        this.sprite.clearTint();
      }
    }
  }

  private hurt(effect: LiquidEffect): void {
    if (effect.battery > 0) {
      this.stats.battery -= effect.battery;
    }

    this.stats.life -= effect.life;

    if (this.sprite.isTinted) {
      this.sprite.clearTint();
    } else {
      const [topLeft, topRight, bottomLeft, bottomRight] = effect.tint;

      this.sprite.setTint(topLeft, topRight, bottomLeft, bottomRight);
    }
  }
}
