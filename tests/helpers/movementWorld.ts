import { ButtonState } from "@/input/ButtonState";
import { ControllerKey } from "@/input/ControllerKey";
import {
  DirectionAxisX,
  DirectionAxisY,
  Facing,
} from "@/miscellaneous/Direction";
import { PowerUps } from "@/miscellaneous/Inventory";
import { MovementHost, MovementInput } from "@/entities/player/movement/host";

/** What the world around the Player is like in one frame */
export interface Env {
  onFloor: boolean;
  wallLeft: boolean;
  wallRight: boolean;
  blockedLeft: boolean;
  blockedRight: boolean;
  ledgeLeft: { pixelY: number } | null;
  ledgeRight: { pixelY: number } | null;
  ladderTop: boolean;
  overlapsLadder: boolean;
  ledgeToClimb: boolean;
  isSwimming: boolean;
  isAimingDiagonal: boolean;
  facingY: DirectionAxisY;
  previousFacingY: DirectionAxisY;
  dashHeldFor: number;
}

export interface Buttons {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  dash: boolean;
}

export const NO_ENV: Env = {
  onFloor: true,
  wallLeft: false,
  wallRight: false,
  blockedLeft: false,
  blockedRight: false,
  ledgeLeft: null,
  ledgeRight: null,
  ladderTop: false,
  overlapsLadder: false,
  ledgeToClimb: false,
  isSwimming: false,
  isAimingDiagonal: false,
  facingY: DirectionAxisY.MIDDLE,
  previousFacingY: DirectionAxisY.MIDDLE,
  dashHeldFor: 0,
};

/** The numbers of the Player, as in the game (gravity 512) */
export const SPEEDS = {
  jump: -320,
  jumpNoMultiplier: -256,
  maxJump: 384,
  run: 512,
  standingRun: 64,
  maxRun: 192,
  dash: 512,
  ladder: 80,
  base: 256,
};

/**
 * A fake Player: it feels the world it is told about, remembers what the
 * movement asks it to do, and moves with simple physics.
 */
export class FakeHost implements MovementHost {
  public now = 0;
  public env: Env = { ...NO_ENV };

  public facing: Facing = {
    x: DirectionAxisX.CENTER,
    y: DirectionAxisY.MIDDLE,
  };
  public facingForAim: Facing = {
    x: DirectionAxisX.CENTER,
    y: DirectionAxisY.MIDDLE,
  };
  public previousFacing: Facing = {
    x: DirectionAxisX.CENTER,
    y: DirectionAxisY.MIDDLE,
  };

  public baseSpeed = SPEEDS.base;
  public battery: number;

  // the body
  public vx = 0;
  public vy = 0;
  public ax = 0;
  public dragX = 0;
  public maxVx = SPEEDS.maxRun;
  public maxVy = SPEEDS.maxJump;
  public allowGravity = true;

  // what was asked in this frame
  public moveToCalls: [number | null, number | null][] = [];
  public climbCalls: [number, number][] = [];

  private readonly buttons = new ButtonState<ControllerKey>();
  private held: Buttons = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    dash: false,
  };

  public constructor(
    private readonly owned: ReadonlySet<PowerUps>,
    battery: number
  ) {
    this.battery = battery;

    const host = this;

    this.input = {
      get left() {
        return host.held.left;
      },
      get right() {
        return host.held.right;
      },
      get up() {
        return host.held.up;
      },
      get down() {
        return host.held.down;
      },
      get jump() {
        return host.held.jump;
      },
      get dash() {
        return host.held.dash;
      },
      justPressed: (key: ControllerKey) => host.buttons.justPressed(key),
      getDashDuration: () => host.env.dashHeldFor,
    };
  }

  /** The buttons, as the movement reads them */
  public readonly input: MovementInput;

  public setButtons(next: Buttons): void {
    if (next.down && !this.held.down) {
      this.buttons.press(ControllerKey.DOWN, this.now);
    } else if (!next.down && this.held.down) {
      this.buttons.release(ControllerKey.DOWN);
    }

    this.held = { ...next };
  }

  // --- MovementHost
  public get isAimingDiagonal(): boolean {
    return this.env.isAimingDiagonal;
  }

  public get isSwimming(): boolean {
    return this.env.isSwimming;
  }

  public get velocity() {
    return { x: this.vx, y: this.vy };
  }

  public get blocked() {
    return { left: this.env.blockedLeft, right: this.env.blockedRight };
  }

  public isOnFloor(): boolean {
    return this.env.onFloor;
  }

  public equip(item: PowerUps): boolean {
    return this.owned.has(item);
  }

  public isTouchingWall(side: DirectionAxisX.LEFT | DirectionAxisX.RIGHT) {
    return side === DirectionAxisX.LEFT
      ? this.env.wallLeft
      : this.env.wallRight;
  }

  public findLedge(side: DirectionAxisX.LEFT | DirectionAxisX.RIGHT) {
    return side === DirectionAxisX.LEFT
      ? this.env.ledgeLeft
      : this.env.ledgeRight;
  }

  public isOnLadderTop(): boolean {
    return this.env.ladderTop;
  }

  public overlapsLadder(): boolean {
    return this.env.overlapsLadder;
  }

  public hasLedgeToClimb(): boolean {
    return this.env.ledgeToClimb;
  }

  public getJumpSpeed(applyMultiplier = true): number {
    return applyMultiplier ? SPEEDS.jump : SPEEDS.jumpNoMultiplier;
  }

  public getMaxJumpSpeed = () => SPEEDS.maxJump;
  public getRunSpeed = () => SPEEDS.run;
  public getStandingRunSpeed = () => SPEEDS.standingRun;
  public getMaxRunSpeed = () => SPEEDS.maxRun;
  public getDashSpeed = () => SPEEDS.dash;
  public getLadderClimbSpeed = () => SPEEDS.ladder;

  public setVelocity(x: number, y: number): void {
    this.vx = x;
    this.vy = y;
  }

  public setVelocityX(x: number): void {
    this.vx = x;
  }

  public setVelocityY(y: number): void {
    this.vy = y;
  }

  public setAccelerationX(x: number): void {
    this.ax = x;
  }

  public setDragX(x: number): void {
    this.dragX = x;
  }

  public setMaxVelocity(x: number, y: number): void {
    this.maxVx = x;
    this.maxVy = y;
  }

  public setAllowGravity(allow: boolean): void {
    this.allowGravity = allow;
  }

  public moveTo(x: number | null, y: number | null): void {
    this.moveToCalls.push([x, y]);
  }

  public climb(x: number, y: number): void {
    this.climbCalls.push([x, y]);
  }

  // --- the world
  public beginFrame(): void {
    this.moveToCalls = [];
    this.climbCalls = [];

    // The physics ran before the update: a body on the floor does not fall
    if (this.env.onFloor && this.vy > 0) {
      this.vy = 0;
    }
  }

  /** Simple physics: what Arcade does with the speeds, in one step */
  public endFrame(delta = 1 / 60): void {
    if (this.ax !== 0) {
      this.vx += this.ax * delta;
    } else if (this.vx > 0) {
      this.vx = Math.max(0, this.vx - this.dragX * delta);
    } else if (this.vx < 0) {
      this.vx = Math.min(0, this.vx + this.dragX * delta);
    }
    this.vx = Math.min(Math.max(this.vx, -this.maxVx), this.maxVx);

    if (this.allowGravity) {
      this.vy += 512 * delta;
    }
    this.vy = Math.min(Math.max(this.vy, -this.maxVy), this.maxVy);

    if (this.env.onFloor && this.vy > 0) {
      this.vy = 0;
    }

    this.now += delta * 1000;
  }
}

/** A repeatable random number generator */
export function random(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
