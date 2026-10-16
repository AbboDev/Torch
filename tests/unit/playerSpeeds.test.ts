import { describe, expect, it } from "vitest";
import { MovementContext } from "@/entities/player/movement";
import { PlayerSpeeds } from "@/entities/player/PlayerSpeeds";

const context = (change: Partial<MovementContext> = {}): MovementContext => ({
  isSwimming: false,
  hasFan: false,
  hasGlove: false,
  hasRocket: false,
  hasBoots: false,
  hasBooster: false,
  canWallJump: false,
  canDoubleJump: false,
  ...change,
});

// The game has a gravity of 512: the base speed is half of it
const BASE = 256;

describe("PlayerSpeeds", () => {
  it("has the speeds of the Player with nothing special", () => {
    const speeds = new PlayerSpeeds(BASE, () => context());

    expect(speeds.getJumpSpeed()).toBe(-320);
    expect(speeds.getJumpSpeed(false)).toBe(-256);
    expect(speeds.getMaxJumpSpeed()).toBe(384);
    expect(speeds.getRunSpeed()).toBe(512);
    expect(speeds.getMaxRunSpeed()).toBe(192);
    expect(speeds.getDashSpeed()).toBe(512);
    expect(speeds.getStandingRunSpeed()).toBe(64);
    expect(speeds.getLadderClimbSpeed()).toBe(44);
  });

  it("changes with what the Player owns, asking at every call", () => {
    let current = context();
    const speeds = new PlayerSpeeds(BASE, () => current);

    current = context({ hasBoots: true });
    expect(speeds.getJumpSpeed()).toBe(-384);

    current = context({ hasBooster: true });
    expect(speeds.getMaxRunSpeed()).toBe(384);

    current = context({ isSwimming: true });
    expect(speeds.getMaxRunSpeed()).toBe(128);
    expect(speeds.getRunSpeed()).toBe(256 * 0.5);
  });
});
