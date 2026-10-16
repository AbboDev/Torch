import { ZONE_TICK } from "@/config/damage";
import { Damageable, DamageSource, applyDamage } from "@/combat/damage";

/** Never more ticks in one frame than these: a long frame does not kill */
const MAX_TICKS_PER_UPDATE = 5;

/**
 * Damage which comes every little while for as long as there is a source: a
 * zone, an aura, a poison. It is for any `Damageable`, so the Player and the
 * enemies can stand in the same zone, and it hurts them by their own defense.
 */
export class DamageOverTime {
  private elapsed = 0;

  /**
   * @param target    Who is hurt
   * @param getSource What hurts now, or null if nothing does
   * @param tick      Milliseconds between two hits
   * @param onHurt    Called after every hit, with the life it took
   */
  public constructor(
    private readonly target: Damageable,
    private readonly getSource: () => DamageSource | null,
    private readonly tick = ZONE_TICK,
    private readonly onHurt?: (damage: number, source: DamageSource) => void
  ) {}

  /**
   * Call it every frame. The first hit comes a whole tick after the source
   * starts, and the time starts again when it stops.
   *
   * @param delta Milliseconds from the last frame
   * @return The life taken in this frame
   */
  public update(delta: number): number {
    const source = this.getSource();

    if (!source) {
      this.elapsed = 0;

      return 0;
    }

    this.elapsed = Math.min(
      this.elapsed + delta,
      this.tick * MAX_TICKS_PER_UPDATE
    );

    let total = 0;

    while (this.elapsed >= this.tick) {
      this.elapsed -= this.tick;

      const damage = applyDamage(this.target, source);
      total += damage;

      if (damage > 0) {
        this.onHurt?.(damage, source);
      }
    }

    return total;
  }
}
