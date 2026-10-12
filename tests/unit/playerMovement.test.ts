import { describe, expect, it } from "vitest";
import {
  BOOSTED_RUN_SPEED_MULTIPLIER,
  HIGH_JUMP_SPEED_MULTIPLIER,
  JUMP_SPEED_MULTIPLIER,
  MovementContext,
  RUN_SPEED_MULTIPLIER,
  SWIM_X_SPEED_MULTIPLIER,
  SWIM_Y_SPEED_MULTIPLIER,
  WALL_JUMP_SPEED_MULTIPLIER,
  getJumpSpeedMultiplier,
  getRunSpeed,
  getRunSpeedMultiplier,
} from "@/entities/player/movement";

const base: MovementContext = {
  isSwimming: false,
  hasFan: false,
  hasGlove: false,
  hasRocket: false,
  hasBoots: false,
  hasBooster: false,
  canWallJump: false,
  canDoubleJump: false,
};

const withContext = (change: Partial<MovementContext>): MovementContext => ({
  ...base,
  ...change,
});

describe("jump speed multiplier", () => {
  it("is the default without power-ups", () => {
    expect(getJumpSpeedMultiplier(base)).toBe(JUMP_SPEED_MULTIPLIER);
  });

  it("is higher with the high jump boots", () => {
    expect(getJumpSpeedMultiplier(withContext({ hasBoots: true }))).toBe(
      HIGH_JUMP_SPEED_MULTIPLIER
    );
  });

  it("uses the wall jump value only while a wall jump is possible", () => {
    expect(getJumpSpeedMultiplier(withContext({ hasGlove: true }))).toBe(
      JUMP_SPEED_MULTIPLIER
    );
    expect(
      getJumpSpeedMultiplier(withContext({ hasGlove: true, canWallJump: true }))
    ).toBe(WALL_JUMP_SPEED_MULTIPLIER);
  });

  it("uses the default value for the double jump, even with the boots", () => {
    expect(
      getJumpSpeedMultiplier(
        withContext({ hasRocket: true, canDoubleJump: true, hasBoots: true })
      )
    ).toBe(JUMP_SPEED_MULTIPLIER);
  });

  it("gives the wall jump priority over the double jump", () => {
    expect(
      getJumpSpeedMultiplier(
        withContext({
          hasGlove: true,
          canWallJump: true,
          hasRocket: true,
          canDoubleJump: true,
        })
      )
    ).toBe(WALL_JUMP_SPEED_MULTIPLIER);
  });

  it("is hindered in liquids unless the swim power-up is equipped", () => {
    const swimming = withContext({ isSwimming: true, hasBoots: true });

    expect(getJumpSpeedMultiplier(swimming)).toBe(SWIM_Y_SPEED_MULTIPLIER);
    expect(getJumpSpeedMultiplier({ ...swimming, hasFan: true })).toBe(
      HIGH_JUMP_SPEED_MULTIPLIER
    );
  });
});

describe("run speed", () => {
  it("has a default and a boosted multiplier", () => {
    expect(getRunSpeedMultiplier(base)).toBe(RUN_SPEED_MULTIPLIER);
    expect(getRunSpeedMultiplier(withContext({ hasBooster: true }))).toBe(
      BOOSTED_RUN_SPEED_MULTIPLIER
    );
  });

  it("is hindered in liquids, even with the booster, unless swimming is unlocked", () => {
    const swimming = withContext({ isSwimming: true, hasBooster: true });

    expect(getRunSpeedMultiplier(swimming)).toBe(SWIM_X_SPEED_MULTIPLIER);
    expect(getRunSpeedMultiplier({ ...swimming, hasFan: true })).toBe(
      BOOSTED_RUN_SPEED_MULTIPLIER
    );
  });

  it("accelerates at twice the base speed, halved in liquids", () => {
    expect(getRunSpeed(100, base)).toBe(200);
    expect(getRunSpeed(100, withContext({ isSwimming: true }))).toBe(
      100 * SWIM_X_SPEED_MULTIPLIER
    );
    expect(
      getRunSpeed(100, withContext({ isSwimming: true, hasFan: true }))
    ).toBe(200);
  });
});
