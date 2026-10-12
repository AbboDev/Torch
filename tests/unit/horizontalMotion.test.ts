import { describe, expect, it } from "vitest";
import {
  AIR_STOP_TIME,
  GROUND_STOP_TIME,
  LIQUID_STOP_TIME,
  TURN_ACCELERATION_MULTIPLIER,
  getAcceleration,
  getDeceleration,
  getStopTime,
} from "@/entities/player/horizontalMotion";
import { Vec, createBody, run } from "../helpers/arcade";

// The values of the Player: gravity 512 -> base speed 256
const BASE_SPEED = 256;
const TOP_SPEED = BASE_SPEED * 0.75;
const ACCELERATION = BASE_SPEED * 2;

const onFloor = { isOnFloor: true, isSwimming: false };
const inAir = { isOnFloor: false, isSwimming: false };
const swimming = { isOnFloor: false, isSwimming: true };

describe("stop time", () => {
  it("is short on the floor, longer in the air and in a liquid", () => {
    expect(getStopTime(onFloor)).toBe(GROUND_STOP_TIME);
    expect(getStopTime(inAir)).toBe(AIR_STOP_TIME);
    expect(getStopTime(swimming)).toBe(LIQUID_STOP_TIME);
    expect(GROUND_STOP_TIME).toBeLessThan(LIQUID_STOP_TIME);
    expect(LIQUID_STOP_TIME).toBeLessThan(AIR_STOP_TIME);
  });

  it("gives the deceleration which stops from the top speed in that time", () => {
    expect(getDeceleration(TOP_SPEED, onFloor)).toBeCloseTo(
      TOP_SPEED / GROUND_STOP_TIME
    );
  });
});

describe("getAcceleration", () => {
  it("is the normal acceleration while speeding up or standing still", () => {
    expect(getAcceleration(1, ACCELERATION, 0)).toBe(ACCELERATION);
    expect(getAcceleration(1, ACCELERATION, 100)).toBe(ACCELERATION);
    expect(getAcceleration(-1, ACCELERATION, -100)).toBe(-ACCELERATION);
  });

  it("is boosted while pushing against the direction of the movement", () => {
    expect(getAcceleration(-1, ACCELERATION, 100)).toBe(
      -ACCELERATION * TURN_ACCELERATION_MULTIPLIER
    );
    expect(getAcceleration(1, ACCELERATION, -100)).toBe(
      ACCELERATION * TURN_ACCELERATION_MULTIPLIER
    );
  });
});

describe("sliding, with the real Arcade Physics", () => {
  const runningBody = (context: typeof onFloor) => {
    const body = createBody({
      maxVelocity: new Vec(TOP_SPEED, 1000),
    });
    body.velocity.set(TOP_SPEED, 0);
    body.drag.set(getDeceleration(TOP_SPEED, context), 0);

    return body;
  };

  it("stops quickly on the floor and does not slide for more than a tile", () => {
    const body = runningBody(onFloor);

    const seconds = run(body, (b) => b.velocity.x === 0);

    expect(seconds).toBeLessThan(GROUND_STOP_TIME + 0.05);
    expect(body.x).toBeLessThan(16);
  });

  it("keeps more of the momentum in the air, but still stops", () => {
    const body = runningBody(inAir);

    const seconds = run(body, (b) => b.velocity.x === 0);

    expect(seconds).toBeGreaterThan(0.3);
    expect(seconds).toBeLessThan(AIR_STOP_TIME + 0.05);
  });

  it("is what the old damping drag of 0.9 did not do: it slid for 25 seconds", () => {
    const body = createBody({
      maxVelocity: new Vec(TOP_SPEED, 1000),
      useDamping: true,
    });
    body.velocity.set(TOP_SPEED, 0);
    body.drag.set(0.9, 0);

    // The Player was stopped by hand under baseSpeed / 20 px per second
    const seconds = run(body, (b) => Math.abs(b.velocity.x) < BASE_SPEED / 20);

    expect(seconds).toBeGreaterThan(20);
  });

  it("does not change how fast the Player reaches the top speed", () => {
    const body = createBody({ maxVelocity: new Vec(TOP_SPEED, 1000) });
    body.drag.set(getDeceleration(TOP_SPEED, onFloor), 0);
    body.acceleration.set(getAcceleration(1, ACCELERATION, 0), 0);

    const seconds = run(body, (b) => b.velocity.x >= TOP_SPEED);

    expect(seconds).toBeCloseTo(TOP_SPEED / ACCELERATION, 1);
  });

  it("turns around quickly instead of skidding", () => {
    const withBoost = createBody({ maxVelocity: new Vec(TOP_SPEED, 1000) });
    withBoost.velocity.set(TOP_SPEED, 0);

    const withoutBoost = createBody({ maxVelocity: new Vec(TOP_SPEED, 1000) });
    withoutBoost.velocity.set(TOP_SPEED, 0);
    withoutBoost.acceleration.set(-ACCELERATION, 0);

    // The acceleration is decided every frame, like Player.walk() does
    let seconds = 0;
    while (withBoost.velocity.x > 0 && seconds < 5) {
      withBoost.acceleration.set(
        getAcceleration(-1, ACCELERATION, withBoost.velocity.x),
        0
      );
      seconds += run(withBoost, () => true);
    }

    const slow = run(withoutBoost, (b) => b.velocity.x <= 0);

    expect(seconds).toBeLessThan(slow / 2);
    expect(seconds).toBeLessThan(0.15);
  });
});
