import type { ControllerKey } from "@/input/ControllerKey";
import type { PowerUps } from "@/miscellaneous/Inventory";
import type { DirectionAxisX, Facing } from "@/miscellaneous/Direction";

/** The buttons of the Player (see PlayerInput) */
export interface MovementInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly up: boolean;
  readonly down: boolean;
  readonly jump: boolean;
  readonly dash: boolean;
  /** True once per press: asking uses the press up */
  justPressed(key: ControllerKey): boolean;
  /** For how long the dash button has been down, in milliseconds */
  getDashDuration(): number;
}

type Side = DirectionAxisX.LEFT | DirectionAxisX.RIGHT;

/**
 * Everything the movement of the Player needs from the Player: what it feels
 * (buttons, the body, the tiles around) and what it can do (change the speed,
 * start climbing). The Player implements it, the tests fake it.
 */
export interface MovementHost {
  /** The time of the game, in milliseconds */
  readonly now: number;
  readonly input: MovementInput;

  /** Where the Player looks and aims: the movement turns it when walking */
  readonly facing: Facing;
  readonly facingForAim: Facing;
  readonly previousFacing: Facing;
  readonly isAimingDiagonal: boolean;

  readonly isSwimming: boolean;
  readonly velocity: { readonly x: number; readonly y: number };
  readonly blocked: { readonly left: boolean; readonly right: boolean };
  /** The default speed, which the other ones come from */
  readonly baseSpeed: number;
  battery: number;

  isOnFloor(): boolean;
  equip(item: PowerUps): boolean;

  isTouchingWall(side: Side): boolean;
  /** The tile the hand on that side can hold on to, if any */
  findLedge(side: Side): { pixelY: number } | null;
  isOnLadderTop(): boolean;
  /** The body overlaps a ladder */
  overlapsLadder(): boolean;
  /** Running against a wall: is there a ledge above to climb onto? */
  hasLedgeToClimb(towardsLeft: boolean): boolean;

  getJumpSpeed(applyMultiplier?: boolean): number;
  getMaxJumpSpeed(): number;
  getRunSpeed(): number;
  getStandingRunSpeed(): number;
  getMaxRunSpeed(): number;
  getDashSpeed(): number;
  getLadderClimbSpeed(): number;

  setVelocity(x: number, y: number): void;
  setVelocityX(x: number): void;
  setVelocityY(y: number): void;
  setAccelerationX(x: number): void;
  setDragX(x: number): void;
  setMaxVelocity(x: number, y: number): void;
  setAllowGravity(allow: boolean): void;
  /** Put the body somewhere at the end of the update (null: leave that axis) */
  moveTo(x: number | null, y: number | null): void;
  /** Start pulling the Player up if the destination has enough room */
  climb(x: number, y: number): boolean;
}
