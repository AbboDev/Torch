/**
 * The geometry of the Player's sensors, with no dependency on Phaser.
 *
 * A sensor is just a rectangle computed from the Player's body. It is asked
 * "are you inside a wall / on a ladder / at a ledge?" and never moves
 * anything, so it needs neither a Game Object nor a physics body.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum AreaPosition {
  FULL = "full",
  TOP_HALF = "top_half",
  LEFT_HALF = "left_half",
  RIGHT_HALF = "right_half",
  BOTTOM_HALF = "bottom_half",
  LEFT_TOP_QUARTER = "left_top_quarter",
  LEFT_BOTTOM_QUARTER = "left_bottom_quarter",
  RIGHT_TOP_QUARTER = "right_top_quarter",
  RIGHT_BOTTOM_QUARTER = "right_bottom_quarter",
}

export interface SensorConfig {
  /** How far from the body a wall is detected, and the size of the hand sensors */
  wallDistance: number;
  /** The height of the wall sensors (they keep it even when the body shrinks) */
  wallHeight: number;
  /** The width of the sensor under the feet */
  ladderWidth: number;
}

export interface SensorRects {
  leftWall: Rect;
  rightWall: Rect;
  leftHand: Rect;
  rightHand: Rect;
  feet: Rect;
}

/**
 * Compute where the sensors are for a body.
 *
 * - the wall sensors are on the sides of the body, around its vertical center
 * - the hand sensors are just above the top corners, one pixel out of the body
 * - the feet sensor is a thin strip across the bottom of the body
 */
export function computeSensors(body: Rect, config: SensorConfig): SensorRects {
  const { wallDistance, wallHeight, ladderWidth } = config;

  const left = body.x;
  const right = body.x + body.width;
  const top = body.y;
  const bottom = body.y + body.height;
  const centerX = body.x + body.width / 2;
  const centerY = body.y + body.height / 2;

  return {
    leftWall: {
      x: left - wallDistance,
      y: centerY - wallHeight / 2,
      width: wallDistance,
      height: wallHeight,
    },
    rightWall: {
      x: right,
      y: centerY - wallHeight / 2,
      width: wallDistance,
      height: wallHeight,
    },
    leftHand: {
      x: left - wallDistance - 1,
      y: top + 1,
      width: wallDistance,
      height: wallDistance,
    },
    rightHand: {
      x: right + 1,
      y: top + 1,
      width: wallDistance,
      height: wallDistance,
    },
    feet: {
      x: centerX - ladderWidth / 2,
      y: bottom - 1,
      width: ladderWidth,
      height: 2,
    },
  };
}

/**
 * The two rectangles intersect (rectangles which only touch do not).
 * Same rule used by Arcade Physics between a body and a tile.
 */
export function overlapsStrict(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * `inner` is entirely inside `outer`, without even touching its borders.
 * Same rule as `Phaser.Geom.Rectangle.ContainsRect`.
 */
export function containsStrict(outer: Rect, inner: Rect): boolean {
  if (inner.width * inner.height > outer.width * outer.height) {
    return false;
  }

  const innerRight = inner.x + inner.width;
  const innerBottom = inner.y + inner.height;

  return (
    inner.x > outer.x &&
    inner.x < outer.x + outer.width &&
    innerRight > outer.x &&
    innerRight < outer.x + outer.width &&
    inner.y > outer.y &&
    inner.y < outer.y + outer.height &&
    innerBottom > outer.y &&
    innerBottom < outer.y + outer.height
  );
}

/**
 * The portion of a tile to consider
 *
 * @param tile The world rectangle of the whole tile
 * @param area Which part of it
 */
export function getArea(tile: Rect, area: AreaPosition): Rect {
  const halfWidth = tile.width / 2;
  const halfHeight = tile.height / 2;
  const centerX = tile.x + halfWidth;
  const centerY = tile.y + halfHeight;

  switch (area) {
    case AreaPosition.TOP_HALF:
      return { x: tile.x, y: tile.y, width: tile.width, height: halfHeight };
    case AreaPosition.BOTTOM_HALF:
      return { x: tile.x, y: centerY, width: tile.width, height: halfHeight };
    case AreaPosition.LEFT_HALF:
      return { x: tile.x, y: tile.y, width: halfWidth, height: tile.height };
    case AreaPosition.RIGHT_HALF:
      return { x: centerX, y: tile.y, width: halfWidth, height: tile.height };
    case AreaPosition.LEFT_TOP_QUARTER:
      return { x: tile.x, y: tile.y, width: halfWidth, height: halfHeight };
    case AreaPosition.LEFT_BOTTOM_QUARTER:
      return { x: tile.x, y: centerY, width: halfWidth, height: halfHeight };
    case AreaPosition.RIGHT_TOP_QUARTER:
      return { x: centerX, y: tile.y, width: halfWidth, height: halfHeight };
    case AreaPosition.RIGHT_BOTTOM_QUARTER:
      return { x: centerX, y: centerY, width: halfWidth, height: halfHeight };
    default:
      return { ...tile };
  }
}

/** The smallest rectangle containing both */
export function unionRect(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);

  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/** The rectangle between `from` and `to`, with `t` going from 0 to 1 */
export function lerpRect(from: Rect, to: Rect, t: number): Rect {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    width: from.width + (to.width - from.width) * t,
    height: from.height + (to.height - from.height) * t,
  };
}

/** A sensor moving faster than this (px per frame) is checked along its path */
const MAX_SAMPLES = 64;

/**
 * Find where a sensor which moved from `from` to `to` was entirely inside
 * `container`, looking at the whole path and not only at its ends: a sensor
 * moving faster than the size of the area could otherwise jump over it
 * between two frames.
 *
 * @return The rectangle of the sensor at the first position found, going
 *         from the newest (`to`) to the oldest (`from`), or null
 */
export function findContainedAlongPath(
  container: Rect,
  from: Rect,
  to: Rect
): Rect | null {
  // One sample per pixel at most: the narrowest area is wider than that
  const distance = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  const steps = Math.min(MAX_SAMPLES, Math.max(1, Math.ceil(distance)));

  for (let step = 0; step <= steps; step++) {
    const rect = lerpRect(to, from, step / steps);

    if (containsStrict(container, rect)) {
      return rect;
    }
  }

  return null;
}
