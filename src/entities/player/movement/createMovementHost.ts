import type * as Phaser from "phaser";
import type { PowerUps } from "@/miscellaneous/Inventory";
import type { PlayerAim } from "@/entities/player/PlayerAim";
import type { PlayerBody } from "@/entities/player/PlayerBody";
import type { PlayerSensors } from "@/entities/player/PlayerSensors";
import type { PlayerSpeeds } from "@/entities/player/PlayerSpeeds";
import type {
  MovementHost,
  MovementInput,
} from "@/entities/player/movement/host";
import type { PlayerStats } from "@/state/GameState";

/** The sprite of the Player, as far as the movement moves it */
type MovedSprite = Pick<
  Phaser.Physics.Arcade.Sprite,
  | "setVelocity"
  | "setVelocityX"
  | "setVelocityY"
  | "setAccelerationX"
  | "setMaxVelocity"
> & { body: Phaser.Physics.Arcade.Body };

/** The pieces of the Player which the movement is connected to */
export interface MovementHostParts {
  sprite: MovedSprite;
  controls: MovementInput;
  aim: PlayerAim;
  stats: PlayerStats;
  speeds: PlayerSpeeds;
  sensors: PlayerSensors;
  shape: PlayerBody;
  baseSpeed: number;
  /** The time of the game, in milliseconds */
  now(): number;
  equip(item: PowerUps): boolean;
  isSwimming(): boolean;
  isOnFloor(): boolean;
  overlapsLadder(): boolean;
  hasLedgeToClimb(towardsLeft: boolean): boolean;
  climb(x: number, y: number): boolean;
}

/**
 * What the movement needs from the Player: what it feels (buttons, body, tiles
 * around) and what it can do (change the speeds, align the body, climb). It
 * connects the movement to the pieces of the Player, and does nothing else.
 */
export function createMovementHost(parts: MovementHostParts): MovementHost {
  const { sprite, aim, stats, speeds, sensors } = parts;

  return {
    get now() {
      return parts.now();
    },
    input: parts.controls,
    get facing() {
      return aim.facing;
    },
    get facingForAim() {
      return aim.facingForAim;
    },
    get previousFacing() {
      return aim.previousFacing;
    },
    get isAimingDiagonal() {
      return aim.isAimingDiagonal;
    },
    get isSwimming() {
      return parts.isSwimming();
    },
    get velocity() {
      return sprite.body.velocity;
    },
    get blocked() {
      return sprite.body.blocked;
    },
    baseSpeed: parts.baseSpeed,
    get battery() {
      return stats.battery;
    },
    set battery(value: number) {
      stats.battery = value;
    },

    isOnFloor: () => parts.isOnFloor(),
    equip: (item) => parts.equip(item),
    isTouchingWall: (side) => sensors.isTouchingWall(side),
    findLedge: (side) => sensors.findLedge(side),
    isOnLadderTop: () => sensors.isOnLadderTop(),
    overlapsLadder: () => parts.overlapsLadder(),
    hasLedgeToClimb: (towardsLeft) => parts.hasLedgeToClimb(towardsLeft),

    getJumpSpeed: (applyMultiplier) => speeds.getJumpSpeed(applyMultiplier),
    getMaxJumpSpeed: () => speeds.getMaxJumpSpeed(),
    getRunSpeed: () => speeds.getRunSpeed(),
    getStandingRunSpeed: () => speeds.getStandingRunSpeed(),
    getMaxRunSpeed: () => speeds.getMaxRunSpeed(),
    getDashSpeed: () => speeds.getDashSpeed(),
    getLadderClimbSpeed: () => speeds.getLadderClimbSpeed(),

    setVelocity: (x, y) => {
      sprite.setVelocity(x, y);
    },
    setVelocityX: (x) => {
      sprite.setVelocityX(x);
    },
    setVelocityY: (y) => {
      sprite.setVelocityY(y);
    },
    setAccelerationX: (x) => {
      sprite.setAccelerationX(x);
    },
    setDragX: (x) => {
      sprite.body.setDragX(x);
    },
    setMaxVelocity: (x, y) => {
      sprite.setMaxVelocity(x, y);
    },
    setAllowGravity: (allow) => {
      sprite.body.setAllowGravity(allow);
    },
    moveTo: (x, y) => parts.shape.moveTo(x, y),
    climb: (x, y) => parts.climb(x, y),
  };
}
