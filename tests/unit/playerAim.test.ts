import { describe, expect, it, vi } from "vitest";
import { AimInput, AimState, computeAim } from "@/entities/player/aim";
import { DirectionAxisY } from "@/miscellaneous/Direction";

// Direction.ts imports Phaser, which needs a browser: only the enums are used here
vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

const none: AimInput = {
  aim: false,
  up: false,
  down: false,
  left: false,
  right: false,
};

const idle: AimState = {
  facingY: DirectionAxisY.MIDDLE,
  facingForAimY: DirectionAxisY.MIDDLE,
  isAimingDiagonal: false,
  wasAimingDiagonal: false,
};

describe("computeAim", () => {
  it("aims straight when nothing is pressed", () => {
    expect(computeAim(none, idle, 0)).toEqual(idle);
  });

  it("aims up when up is pressed", () => {
    const aim = computeAim({ ...none, up: true }, idle, 0);

    expect(aim.facingY).toBe(DirectionAxisY.UP);
    expect(aim.facingForAimY).toBe(DirectionAxisY.UP);
    expect(aim.isAimingDiagonal).toBe(false);
  });

  it("does not aim down just by pressing down while standing still (it crouches)", () => {
    const aim = computeAim({ ...none, down: true }, idle, 0);

    expect(aim.facingY).toBe(DirectionAxisY.MIDDLE);
  });

  it("aims down when pressing down in mid air", () => {
    const aim = computeAim({ ...none, down: true }, idle, 120);

    expect(aim.facingY).toBe(DirectionAxisY.DOWN);
    expect(aim.facingForAimY).toBe(DirectionAxisY.DOWN);
  });

  it("aims down diagonally when moving and pressing down", () => {
    const aim = computeAim({ ...none, down: true, right: true }, idle, 0);

    expect(aim.facingY).toBe(DirectionAxisY.DOWN);
    expect(aim.isAimingDiagonal).toBe(true);
  });

  it("aims diagonally up with the aim button", () => {
    const aim = computeAim({ ...none, aim: true }, idle, 0);

    expect(aim.facingY).toBe(DirectionAxisY.UP);
    expect(aim.isAimingDiagonal).toBe(true);
  });

  it("keeps the diagonal aim while it is active and nothing selects a direction", () => {
    const diagonal: AimState = {
      facingY: DirectionAxisY.DOWN,
      facingForAimY: DirectionAxisY.DOWN,
      isAimingDiagonal: true,
      wasAimingDiagonal: false,
    };

    const aim = computeAim({ ...none, aim: true }, diagonal, 0);

    expect(aim.facingY).toBe(DirectionAxisY.DOWN);
    expect(aim.isAimingDiagonal).toBe(true);
    expect(aim.wasAimingDiagonal).toBe(true);
  });

  it("goes back to the middle when leaving the diagonal aim", () => {
    const diagonal: AimState = {
      facingY: DirectionAxisY.UP,
      facingForAimY: DirectionAxisY.UP,
      isAimingDiagonal: true,
      wasAimingDiagonal: true,
    };

    // The aim button is released while the diagonal was active: the
    // direction is kept for one frame, then released
    const first = computeAim(none, diagonal, 0);
    expect(first.facingY).toBe(DirectionAxisY.UP);
    expect(first.isAimingDiagonal).toBe(false);

    const second = computeAim(none, first, 0);
    expect(second.facingY).toBe(DirectionAxisY.MIDDLE);
  });
});
