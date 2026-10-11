export interface RequestedPosition {
  /** The x to put the body at, or null to leave it */
  x: number | null;
  /** The y to put the body at, or null to leave it */
  y: number | null;
}

/**
 * A position the body has to be put at at the end of the update, once the
 * rest has run (a ledge to align with, ...). Several parts can ask during the
 * update: each coordinate asked for last wins, the one nobody asked for is
 * left as it is. No dependency on Phaser.
 */
export class PositionRequest {
  private x: number | null = null;

  private y: number | null = null;

  private pending = false;

  /** Somebody asked for a position and it was not taken yet */
  public get isPending(): boolean {
    return this.pending;
  }

  /** Ask for a position; null leaves that coordinate as it was asked or is */
  public set(x: number | null, y: number | null): void {
    if (x !== null) {
      this.x = x;
    }

    if (y !== null) {
      this.y = y;
    }

    this.pending = true;
  }

  /**
   * Move what was asked: the body changed shape and its corner moved by this
   * much. A coordinate nobody asked for stays unasked.
   */
  public shift(dx: number, dy: number): void {
    if (!this.pending) {
      return;
    }

    if (this.x !== null) {
      this.x += dx;
    }

    if (this.y !== null) {
      this.y += dy;
    }
  }

  /** The position to put the body at, if one was asked: it is then forgotten */
  public take(): RequestedPosition | null {
    if (!this.pending) {
      return null;
    }

    const position = { x: this.x, y: this.y };

    this.x = null;
    this.y = null;
    this.pending = false;

    return position;
  }
}
