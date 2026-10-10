/**
 * Which buttons are down, since when, and which presses were already used.
 * No dependency on Phaser or the browser.
 */
export class ButtonState<Key extends string> {
  /** The buttons held down, with the time they went down */
  private readonly down = new Map<Key, number>();

  /** The buttons whose current press was already taken by `justPressed` */
  private readonly used = new Set<Key>();

  public press(key: Key, now: number): void {
    if (!this.down.has(key)) {
      this.down.set(key, now);
    }
  }

  public release(key: Key): void {
    this.down.delete(key);
    this.used.delete(key);
  }

  public releaseAll(): void {
    this.down.clear();
    this.used.clear();
  }

  public isDown(key: Key): boolean {
    return this.down.has(key);
  }

  /**
   * True once per press: the first time it is asked while the button is down.
   * Asking uses the press up, so ask only where the action can really happen.
   */
  public justPressed(key: Key): boolean {
    if (!this.down.has(key) || this.used.has(key)) {
      return false;
    }

    this.used.add(key);

    return true;
  }

  /** For how long the button has been down, in milliseconds (0 if it is not) */
  public duration(key: Key, now: number): number {
    const since = this.down.get(key);

    return since === undefined ? 0 : now - since;
  }
}
