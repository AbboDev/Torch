import { Damageable, Defense, NO_DEFENSE } from "@/combat/damage";

/**
 * The life of something which can die: an enemy. It is a `Damageable`, so
 * shots, zones and anything which hurts work on it as on the Player.
 */
export class Health implements Damageable {
  public life: number;

  private hasDied = false;

  /**
   * @param maxLife The life it starts with
   * @param defense What protects it
   * @param onDeath Called once, when the life is over
   */
  public constructor(
    public readonly maxLife: number,
    private readonly defense: Defense = NO_DEFENSE,
    private readonly onDeath?: () => void
  ) {
    this.life = maxLife;
  }

  public get isDead(): boolean {
    return this.life <= 0;
  }

  public getDefense(): Defense {
    return this.defense;
  }

  public takeDamage(amount: number): void {
    if (this.hasDied) {
      return;
    }

    this.life = Math.max(0, this.life - amount);

    if (this.life === 0) {
      this.hasDied = true;
      this.onDeath?.();
    }
  }
}
