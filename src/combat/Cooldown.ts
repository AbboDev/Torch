/**
 * Something which can be done again only after a while: an enemy which touches
 * the Player hurts it once in a while, not at every frame.
 */
export class Cooldown {
  private readyAt = -Infinity;

  /** @param duration Milliseconds before it can be used again */
  public constructor(private readonly duration: number) {}

  /**
   * @param time The time of the game, in milliseconds
   * @return True, and the time starts again, if it can be used now
   */
  public tryUse(time: number): boolean {
    if (time < this.readyAt) {
      return false;
    }

    this.readyAt = time + this.duration;

    return true;
  }
}
