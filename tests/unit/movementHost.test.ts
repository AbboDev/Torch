import { describe, expect, it, vi } from "vitest";
import {
  MovementHostParts,
  createMovementHost,
} from "@/entities/player/movement/createMovementHost";
import { PlayerAim } from "@/entities/player/PlayerAim";
import { DirectionAxisX } from "@/miscellaneous/Direction";
import { PowerUps } from "@/miscellaneous/Inventory";
import { GameState } from "@/state/GameState";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

function setup() {
  const body = {
    velocity: { x: 10, y: -20 },
    blocked: { left: true, right: false },
    setDragX: vi.fn(),
    setAllowGravity: vi.fn(),
  };
  const sprite = {
    body,
    setVelocity: vi.fn(),
    setVelocityX: vi.fn(),
    setVelocityY: vi.fn(),
    setAccelerationX: vi.fn(),
    setMaxVelocity: vi.fn(),
  };

  const state = new GameState();
  const aim = new PlayerAim();
  const sensors = {
    isTouchingWall: vi.fn(() => true),
    findLedge: vi.fn(() => ({ pixelY: 96 })),
    isOnLadderTop: vi.fn(() => true),
  };
  const speeds = {
    getJumpSpeed: vi.fn(() => -320),
    getMaxJumpSpeed: vi.fn(() => 384),
    getRunSpeed: vi.fn(() => 512),
    getStandingRunSpeed: vi.fn(() => 64),
    getMaxRunSpeed: vi.fn(() => 192),
    getDashSpeed: vi.fn(() => 512),
    getLadderClimbSpeed: vi.fn(() => 48),
  };
  const shape = { moveTo: vi.fn() };
  const controls = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    dash: false,
    justPressed: () => false,
    getDashDuration: () => 0,
  };

  let time = 1000;
  let swimming = false;
  const parts = {
    sprite,
    controls,
    aim,
    stats: state.player,
    speeds,
    sensors,
    shape,
    baseSpeed: 256,
    now: () => time,
    equip: vi.fn((item: PowerUps) => item === PowerUps.HOOK),
    isSwimming: () => swimming,
    isOnFloor: vi.fn(() => true),
    overlapsLadder: vi.fn(() => true),
    hasLedgeToClimb: vi.fn(() => true),
    climb: vi.fn(() => true),
  } as unknown as MovementHostParts;

  return {
    host: createMovementHost(parts),
    parts,
    body,
    sprite,
    state,
    aim,
    sensors,
    speeds,
    shape,
    controls,
    setTime: (value: number) => (time = value),
    setSwimming: (value: boolean) => (swimming = value),
  };
}

describe("createMovementHost", () => {
  it("tells the time of the game, as it is now", () => {
    const { host, setTime } = setup();

    expect(host.now).toBe(1000);
    setTime(1016);
    expect(host.now).toBe(1016);
  });

  it("gives the buttons of the Player", () => {
    const { host, controls } = setup();

    expect(host.input).toBe(controls);
  });

  it("gives the aim of the Player, the same objects the movement turns", () => {
    const { host, aim } = setup();

    host.facing.x = DirectionAxisX.LEFT;
    aim.remember();

    expect(aim.facing.x).toBe(DirectionAxisX.LEFT);
    expect(host.facing).toBe(aim.facing);
    expect(host.facingForAim).toBe(aim.facingForAim);
    expect(host.previousFacing).toBe(aim.previousFacing);
    expect(host.isAimingDiagonal).toBe(false);

    aim.isAimingDiagonal = true;
    expect(host.isAimingDiagonal).toBe(true);
  });

  it("reads the speed and the blocked sides of the body as they are now", () => {
    const { host, body } = setup();

    expect(host.velocity).toEqual({ x: 10, y: -20 });
    expect(host.blocked).toEqual({ left: true, right: false });

    body.velocity = { x: 0, y: 5 };
    expect(host.velocity.y).toBe(5);
  });

  it("reads and writes the battery in the game state", () => {
    const { host, state } = setup();

    host.battery = 40;
    expect(state.get("battery")).toBe(40);

    state.set("battery", 12);
    expect(host.battery).toBe(12);

    --host.battery;
    expect(state.get("battery")).toBe(11);
  });

  it("asks if the Player is swimming when it is asked", () => {
    const { host, setSwimming } = setup();

    expect(host.isSwimming).toBe(false);
    setSwimming(true);
    expect(host.isSwimming).toBe(true);
  });

  it("asks the sensors and the Player about the world", () => {
    const { host, sensors, parts } = setup();

    expect(host.isTouchingWall(DirectionAxisX.LEFT)).toBe(true);
    expect(sensors.isTouchingWall).toHaveBeenCalledWith(DirectionAxisX.LEFT);
    expect(host.findLedge(DirectionAxisX.RIGHT)).toEqual({ pixelY: 96 });
    expect(host.isOnLadderTop()).toBe(true);
    expect(host.overlapsLadder()).toBe(true);
    expect(host.isOnFloor()).toBe(true);
    expect(host.hasLedgeToClimb(true)).toBe(true);
    expect(parts.hasLedgeToClimb).toHaveBeenCalledWith(true);
    expect(host.equip(PowerUps.HOOK)).toBe(true);
    expect(host.equip(PowerUps.DASH)).toBe(false);
  });

  it("asks the speeds", () => {
    const { host, speeds } = setup();

    expect(host.getJumpSpeed(false)).toBe(-320);
    expect(speeds.getJumpSpeed).toHaveBeenCalledWith(false);
    expect(host.getMaxJumpSpeed()).toBe(384);
    expect(host.getRunSpeed()).toBe(512);
    expect(host.getStandingRunSpeed()).toBe(64);
    expect(host.getMaxRunSpeed()).toBe(192);
    expect(host.getDashSpeed()).toBe(512);
    expect(host.getLadderClimbSpeed()).toBe(48);
    expect(host.baseSpeed).toBe(256);
  });

  it("moves the sprite and its body", () => {
    const { host, sprite, body } = setup();

    host.setVelocity(1, 2);
    host.setVelocityX(3);
    host.setVelocityY(4);
    host.setAccelerationX(5);
    host.setMaxVelocity(6, 7);
    host.setDragX(8);
    host.setAllowGravity(false);

    expect(sprite.setVelocity).toHaveBeenCalledWith(1, 2);
    expect(sprite.setVelocityX).toHaveBeenCalledWith(3);
    expect(sprite.setVelocityY).toHaveBeenCalledWith(4);
    expect(sprite.setAccelerationX).toHaveBeenCalledWith(5);
    expect(sprite.setMaxVelocity).toHaveBeenCalledWith(6, 7);
    expect(body.setDragX).toHaveBeenCalledWith(8);
    expect(body.setAllowGravity).toHaveBeenCalledWith(false);
  });

  it("asks to align the body and to climb", () => {
    const { host, shape, parts } = setup();

    host.moveTo(null, 96);
    expect(host.climb(16, 32)).toBe(true);

    expect(shape.moveTo).toHaveBeenCalledWith(null, 96);
    expect(parts.climb).toHaveBeenCalledWith(16, 32);
  });
});
