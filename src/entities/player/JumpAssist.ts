/**
 * Two small helps which make the jump feel fair, with no dependency on Phaser.
 *
 * - Coyote time: for a moment after walking off a ledge the Player can still
 *   jump from the ground, because pressing the button a few milliseconds
 *   late is not a mistake worth a fall.
 * - Jump buffer: a press made just before landing, and still held when the
 *   Player lands, makes the jump start on landing instead of being lost.
 *
 * Times are in milliseconds. Set one of them to 0 to turn that help off.
 */

/** For how long the Player can still jump after leaving the ground */
export const COYOTE_TIME = 100;

/** For how long before landing a press of the jump button is remembered */
export const JUMP_BUFFER_TIME = 100;

export interface JumpAssistConfig {
  coyoteTime: number;
  bufferTime: number;
}

export class JumpAssist {
  private lastOnFloor = -Infinity;

  private lastPress = -Infinity;

  private wasHeld = false;

  private hasJumped = false;

  public constructor(
    private readonly config: JumpAssistConfig = {
      coyoteTime: COYOTE_TIME,
      bufferTime: JUMP_BUFFER_TIME,
    }
  ) {}

  /**
   * Call it once per frame
   *
   * @param now      The time in milliseconds
   * @param onFloor  The Player is on the floor
   * @param jumpHeld The jump button is held down
   */
  public update(now: number, onFloor: boolean, jumpHeld: boolean): void {
    if (onFloor) {
      this.lastOnFloor = now;
      this.hasJumped = false;
    }

    // The moment the button goes down
    if (jumpHeld && !this.wasHeld) {
      this.lastPress = now;
    }

    this.wasHeld = jumpHeld;
  }

  /**
   * The Player can start a jump from the ground: it is on it, or it left it
   * a moment ago without jumping.
   */
  public canJumpFromGround(now: number, onFloor: boolean): boolean {
    if (onFloor) {
      return true;
    }

    return !this.hasJumped && now - this.lastOnFloor <= this.config.coyoteTime;
  }

  /**
   * The jump button was pressed just before, and it is still held: a press
   * the Player made in the air and which would otherwise have been lost.
   */
  public hasBufferedPress(now: number, jumpHeld: boolean): boolean {
    return jumpHeld && now - this.lastPress <= this.config.bufferTime;
  }

  /**
   * The Player jumped (or climbed): no more coyote time until it touches the
   * ground again, and the press which started it is used up.
   */
  public notifyJumped(): void {
    this.hasJumped = true;
    this.lastPress = -Infinity;
  }
}
