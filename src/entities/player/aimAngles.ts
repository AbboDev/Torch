import { TILE_SIZE } from "@/config/tiles";
import { DirectionAxisX, DirectionAxisY } from "@/miscellaneous/Direction";

/**
 * The maths of the free aim, with no dependency on Phaser. Angles are in
 * radians, as `Math.atan2` gives them: 0 is right and the y axis points down,
 * so a positive angle aims below the horizon.
 */
export interface Point {
  x: number;
  y: number;
}

/** The cursor of the gamepad in the world: the CursorScene draws it */
export interface AimCursorState {
  visible: boolean;
  x: number;
  y: number;
}

/** How far the right stick has to go to aim: below it, drift is ignored */
export const STICK_AIM_DEADZONE = 0.35;

/** The distance of the gamepad cursor from the Player, in pixels of the world */
export const AIM_CURSOR_DISTANCE = TILE_SIZE * 4;

/** The angle of the right stick, or null while it is close to the center */
export function stickAngle(x: number, y: number): number | null {
  return Math.hypot(x, y) < STICK_AIM_DEADZONE ? null : Math.atan2(y, x);
}

/**
 * The angle from a point to another. When they are too close for the angle to
 * mean anything (the mouse is on the Player) it is `fallback`.
 */
export function angleBetween(
  from: Point,
  to: Point,
  fallback: number,
  minDistance = 2
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  return Math.hypot(dx, dy) < minDistance ? fallback : Math.atan2(dy, dx);
}

/** The point at `distance` from `origin`, in the direction of `angle` */
export function pointOnCircle(
  origin: Point,
  angle: number,
  distance: number
): Point {
  return {
    x: origin.x + Math.cos(angle) * distance,
    y: origin.y + Math.sin(angle) * distance,
  };
}

/** The eight directions, as the signs of x and y, starting from the right */
const OCTANTS: ReadonlyArray<Point> = [
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];

/** The closest of the eight directions of an angle, as the signs of x and y */
export function octantSign(angle: number): Point {
  const octant = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;

  return { ...OCTANTS[octant] };
}

export type Side = DirectionAxisX.LEFT | DirectionAxisX.RIGHT;

/** What the Player draws for an angle: the sprites only have eight directions */
export interface AimPose {
  side: Side;
  facingY: DirectionAxisY;
  diagonal: boolean;
}

/**
 * The pose of the Player for an angle. Aiming straight up or down it looks at
 * the side the angle leans to, or stays as it was (`previousSide`) if it does not.
 */
export function aimPose(angle: number, previousSide: Side): AimPose {
  const sign = octantSign(angle);
  const lean = Math.cos(angle);

  let side = previousSide;
  if (sign.x !== 0) {
    side = sign.x > 0 ? DirectionAxisX.RIGHT : DirectionAxisX.LEFT;
  } else if (Math.abs(lean) > 1e-6) {
    side = lean > 0 ? DirectionAxisX.RIGHT : DirectionAxisX.LEFT;
  }

  let facingY = DirectionAxisY.MIDDLE;
  if (sign.y > 0) {
    facingY = DirectionAxisY.DOWN;
  } else if (sign.y < 0) {
    facingY = DirectionAxisY.UP;
  }

  return { side, facingY, diagonal: sign.x !== 0 && sign.y !== 0 };
}

/** How fast the keyboard turns the aim, in radians per second */
export const KEYBOARD_AIM_SPEED = (Math.PI * 2) / 3;

/**
 * The elevation of the aim the buttons give (see `PlayerAim`): the fine aim
 * starts from it, so it does not jump when the button goes down
 */
export function poseElevation(
  facingY: DirectionAxisY,
  diagonal: boolean
): number {
  const size = diagonal ? Math.PI / 4 : Math.PI / 2;

  if (facingY === DirectionAxisY.UP) {
    return size;
  }

  return facingY === DirectionAxisY.DOWN ? -size : 0;
}

/**
 * The elevation of the aim (radians above the horizon, negative below it)
 * after `ms` of holding up or down. Straight up and straight down are the limits.
 *
 * @param direction 1 for up, -1 for down, 0 for none
 */
export function stepElevation(
  elevation: number,
  direction: number,
  ms: number
): number {
  const next = elevation + direction * KEYBOARD_AIM_SPEED * (ms / 1000);

  return Math.max(-Math.PI / 2, Math.min(Math.PI / 2, next));
}

/** The angle for an elevation, aiming to the left or to the right */
export function elevationToAngle(elevation: number, isLeft: boolean): number {
  return isLeft ? Math.PI + elevation : -elevation;
}
