import { DirectionAxisX, DirectionAxisY } from "@/miscellaneous/Direction";

/**
 * What decides which animation the Player plays, with no dependency on Phaser
 */
export interface AnimationState {
  isOnFloor: boolean;
  isCrouch: boolean;
  isHanging: boolean;
  isJumping: boolean;
  isStandingJumping: boolean;
  isAimingDiagonal: boolean;
  wasAimingDiagonal: boolean;
  velocityX: number;
  facingY: DirectionAxisY | null;
}

/** The action to play: "idle", "walk", "jump", "aim_up_diagonal", ... */
export function getAnimationAction(state: AnimationState): string {
  if (state.isOnFloor) {
    if (state.isCrouch) {
      return "crouch_idle";
    }

    if (state.velocityX !== 0) {
      return state.isAimingDiagonal ? `aim_${state.facingY}_diagonal` : "walk";
    }

    if (state.isAimingDiagonal) {
      return `aim_${state.facingY}_diagonal`;
    }

    // Avoid going from diagonal to up while leaving aim
    if (state.facingY === DirectionAxisY.UP && !state.wasAimingDiagonal) {
      return `aim_${state.facingY}`;
    }

    return "idle";
  }

  if (state.isHanging) {
    return "hang";
  }

  if (!state.isStandingJumping) {
    return "jump";
  }

  return state.isJumping ? "jump_idle" : "fall_idle";
}

/** The key of the animation in Phaser's animation manager */
export function getAnimationKey(
  action: string,
  facingX: DirectionAxisX | null
): string {
  return `hero_${action}_${facingX}_animation`;
}
