import { describe, expect, it, vi } from "vitest";
import {
  AnimationState,
  getAnimationAction,
  getAnimationKey,
} from "@/entities/player/animation";
import { DirectionAxisX, DirectionAxisY } from "@/miscellaneous/Direction";

vi.mock("phaser", () => ({ Math: { Vector2: class Vector2 {} } }));

const state = (change: Partial<AnimationState> = {}): AnimationState => ({
  isOnFloor: true,
  isCrouch: false,
  isHanging: false,
  isJumping: false,
  isStandingJumping: false,
  isAimingDiagonal: false,
  wasAimingDiagonal: false,
  velocityX: 0,
  facingY: DirectionAxisY.MIDDLE,
  ...change,
});

// The chain of conditions of Player.animate() before it was extracted
function original(s: AnimationState): string {
  let action = "";

  if (s.isOnFloor) {
    if (s.isCrouch) {
      action = "crouch_idle";
    } else if (s.velocityX !== 0) {
      if (s.isAimingDiagonal) {
        action = `aim_${s.facingY}_diagonal`;
      } else {
        action = "walk";
      }
    } else if (s.isAimingDiagonal) {
      action = `aim_${s.facingY}_diagonal`;
    } else if (s.facingY === DirectionAxisY.UP && !s.wasAimingDiagonal) {
      action = `aim_${s.facingY}`;
    } else {
      action = "idle";
    }
  } else if (s.isHanging) {
    action = "hang";
  } else if (!s.isStandingJumping) {
    action = "jump";
  } else if (s.isJumping) {
    action = "jump_idle";
  } else {
    action = "fall_idle";
  }

  return action;
}

describe("getAnimationAction", () => {
  it("picks the same animation as before for every combination", () => {
    const flags = [false, true];
    const directions = [
      DirectionAxisY.UP,
      DirectionAxisY.DOWN,
      DirectionAxisY.MIDDLE,
      null,
    ];
    let count = 0;

    for (const isOnFloor of flags)
      for (const isCrouch of flags)
        for (const isHanging of flags)
          for (const isJumping of flags)
            for (const isStandingJumping of flags)
              for (const isAimingDiagonal of flags)
                for (const wasAimingDiagonal of flags)
                  for (const velocityX of [0, 5, -5])
                    for (const facingY of directions) {
                      const s = {
                        isOnFloor,
                        isCrouch,
                        isHanging,
                        isJumping,
                        isStandingJumping,
                        isAimingDiagonal,
                        wasAimingDiagonal,
                        velocityX,
                        facingY,
                      };

                      expect(getAnimationAction(s)).toBe(original(s));
                      count++;
                    }

    expect(count).toBe(2 ** 7 * 3 * 4);
  });

  it("describes the common cases", () => {
    expect(getAnimationAction(state())).toBe("idle");
    expect(getAnimationAction(state({ velocityX: 100 }))).toBe("walk");
    expect(getAnimationAction(state({ isCrouch: true }))).toBe("crouch_idle");
    expect(getAnimationAction(state({ facingY: DirectionAxisY.UP }))).toBe(
      "aim_up"
    );
    expect(
      getAnimationAction(
        state({ isAimingDiagonal: true, facingY: DirectionAxisY.DOWN })
      )
    ).toBe("aim_down_diagonal");
    expect(getAnimationAction(state({ isOnFloor: false }))).toBe("jump");
    expect(
      getAnimationAction(state({ isOnFloor: false, isHanging: true }))
    ).toBe("hang");
  });
});

describe("getAnimationKey", () => {
  it("builds the key used when the animations are created", () => {
    expect(getAnimationKey("walk", DirectionAxisX.LEFT)).toBe(
      "hero_walk_left_animation"
    );
  });
});
