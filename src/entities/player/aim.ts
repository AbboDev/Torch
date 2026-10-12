import {
  DirectionAxisX,
  DirectionAxisY,
  Facing,
} from "@/miscellaneous/Direction";

export interface AimInput {
  /** The dedicated aim button */
  aim: boolean;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface AimState {
  /** Where the Player is looking along the Y axis */
  facingY: DirectionAxisY;
  /** Where the Player is aiming along the Y axis */
  facingForAimY: DirectionAxisY;
  isAimingDiagonal: boolean;
  wasAimingDiagonal: boolean;
}

/**
 * Compute the aim of the Player for this frame.
 *
 * @param input     The buttons currently held
 * @param current   The aim computed in the previous frame
 * @param velocityY The vertical speed of the Player: when standing still
 *                  "down" alone does not aim down (it is used to crouch)
 */
export function computeAim(
  input: AimInput,
  current: AimState,
  velocityY: number
): AimState {
  const { aim, up, down, left, right } = input;
  const isAimingWhileMoving = (left || right) && (up || down);

  let { facingY, facingForAimY } = current;

  if (up || (aim && !current.isAimingDiagonal)) {
    facingY = DirectionAxisY.UP;
    facingForAimY = DirectionAxisY.UP;
  } else if (down && (velocityY !== 0 || aim || isAimingWhileMoving)) {
    facingY = DirectionAxisY.DOWN;
    facingForAimY = DirectionAxisY.DOWN;
  } else if (!current.isAimingDiagonal) {
    facingY = DirectionAxisY.MIDDLE;
    facingForAimY = DirectionAxisY.MIDDLE;
  }

  return {
    facingY,
    facingForAimY,
    isAimingDiagonal: aim || isAimingWhileMoving,
    wasAimingDiagonal: current.isAimingDiagonal,
  };
}

export interface ShotPlace {
  /** The sprite of the Player: its bounds, position and width */
  top: number;
  bottom: number;
  centerX: number;
  x: number;
  width: number;
  facingForAim: Facing;
  isAimingDiagonal: boolean;
  /** The distance from the top of the sprite to the gun, aiming straight */
  shotHeight: number;
}

/**
 * Where a bullet appears: at the height of the gun aiming straight, at the
 * top aiming up, at the bottom aiming down, and at one side of the Player when
 * aiming diagonally.
 */
export function getShotPosition(place: ShotPlace): { x: number; y: number } {
  const { top, bottom, facingForAim, isAimingDiagonal } = place;

  let x = place.centerX;
  let y = top + place.shotHeight;

  if (facingForAim.y !== DirectionAxisY.MIDDLE) {
    if (facingForAim.y === DirectionAxisY.UP) {
      y = top;
    } else if (isAimingDiagonal) {
      y = bottom - place.shotHeight;
    } else {
      y = bottom;
    }

    if (isAimingDiagonal) {
      x =
        place.x +
        (place.width / 2) * (facingForAim.x === DirectionAxisX.RIGHT ? 1 : -1);
    }
  }

  return { x, y };
}
