import { ControllerKey } from "@/input/ControllerKey";

/**
 * What the Player needs from the input device. The `Controller` implements it
 * today; a gamepad or a replay can implement it tomorrow.
 */
export interface ButtonSource {
  isKeyPressed(key: ControllerKey): boolean;
  isKeyPressedForFirstTime(key: ControllerKey): boolean;
  getKeyDuration(key: ControllerKey): number;
}

/**
 * The buttons of the Player, as named actions.
 *
 * The held buttons are read once per frame by `poll()`, so every part of the
 * update sees the same state. The "first press" and the "hold time" are read
 * on demand: asking whether a button was just pressed consumes the press, so
 * it must only happen where the action can actually be performed.
 */
export class PlayerInput {
  public left = false;
  public right = false;
  public up = false;
  public down = false;
  public jump = false;
  public shoot = false;
  public dash = false;
  public aim = false;

  public constructor(private readonly source: ButtonSource) {}

  /** Read the held buttons: call it once at the start of each update */
  public poll(): void {
    this.left = this.source.isKeyPressed(ControllerKey.LEFT);
    this.right = this.source.isKeyPressed(ControllerKey.RIGHT);
    this.up = this.source.isKeyPressed(ControllerKey.UP);
    this.down = this.source.isKeyPressed(ControllerKey.DOWN);
    this.jump = this.source.isKeyPressed(ControllerKey.A);
    this.shoot = this.source.isKeyPressed(ControllerKey.B);
    this.dash = this.source.isKeyPressed(ControllerKey.X);
    this.aim = this.source.isKeyPressed(ControllerKey.L);
  }

  /** True once per press, then false until the button is released */
  public justPressed(key: ControllerKey): boolean {
    return this.source.isKeyPressedForFirstTime(key);
  }

  /** For how long the dash button has been held, in milliseconds */
  public getDashDuration(): number {
    return this.source.getKeyDuration(ControllerKey.X);
  }
}
