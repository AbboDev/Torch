/**
 * Slopes: tiles with a sloping top, which Arcade Physics does not support.
 * No dependency on Phaser, so the maths can be tested.
 *
 * A slope tile is described in Tiled by two properties of the tile in the
 * tileset: `slopeLeft` and `slopeRight`, the height of the ground at the left
 * and at the right edge of the tile, in pixels, measured from the bottom of
 * the tile (0 to the height of the tile). A 45 degrees ramp going up to the
 * right is 0 and 16; the same one going up to the left is 16 and 0; a gentler
 * one over two tiles is 0 and 8, then 8 and 16. Between the two edges the
 * ground is a straight line.
 *
 * Slopes are ground only: the tile is solid from the sloping line down to its
 * bottom, and there is nothing above the line.
 *
 * How to build them:
 * - Put every tile of the walkable ground in the area of a ramp in the
 *   "slopes" layer: the sloping tiles and the flat ones before and after it
 *   (with heights 16 and 16, the ground is the top of the tile). Leaving the
 *   ramp for a normal solid floor makes the body fall for some frames.
 * - The body of the ramp under the line is not solid for Arcade: do not
 *   fill it with tiles of the collision layer. Tiles without the slope
 *   properties in the slopes layer are only art.
 */

export interface SlopeTile {
  /** Height of the ground at the left edge of the tile, from its bottom */
  left: number;
  /** Height of the ground at the right edge of the tile, from its bottom */
  right: number;
}

/** Where the slopes are: the tile (column, row) at a position, or none */
export interface SlopeField {
  tileWidth: number;
  tileHeight: number;
  /** The world position of the top left corner of the tile (0, 0) */
  originX: number;
  originY: number;
  getSlope(column: number, row: number): SlopeTile | null;
}

/**
 * The slope described by the properties of a tile in Tiled.
 *
 * @param properties The custom properties of the tile
 * @param maxHeight  The height of the tile: heights are kept between 0 and it
 *
 * @return The slope, or null if the tile has no (valid) slope properties
 */
export function parseSlopeProperties(
  properties: Record<string, unknown> | null | undefined,
  maxHeight: number
): SlopeTile | null {
  const left = properties?.slopeLeft;
  const right = properties?.slopeRight;

  if (
    typeof left !== "number" ||
    typeof right !== "number" ||
    !Number.isFinite(left) ||
    !Number.isFinite(right)
  ) {
    return null;
  }

  const clamp = (value: number) => Math.min(Math.max(value, 0), maxHeight);

  return { left: clamp(left), right: clamp(right) };
}

/**
 * A field of slopes kept in a table, built from the tiles of a layer
 */
export class SlopeGrid implements SlopeField {
  private readonly slopes = new Map<string, SlopeTile>();

  public constructor(
    public readonly tileWidth: number,
    public readonly tileHeight: number,
    public readonly originX = 0,
    public readonly originY = 0
  ) {}

  public set(column: number, row: number, slope: SlopeTile): void {
    this.slopes.set(`${column},${row}`, slope);
  }

  public getSlope(column: number, row: number): SlopeTile | null {
    return this.slopes.get(`${column},${row}`) ?? null;
  }

  public get size(): number {
    return this.slopes.size;
  }

  /** Every slope with its column and row */
  public entries(): { column: number; row: number; slope: SlopeTile }[] {
    return [...this.slopes].map(([key, slope]) => {
      const [column, row] = key.split(",").map(Number);

      return { column, row, slope };
    });
  }
}

/**
 * The world y of the ground inside a slope tile
 *
 * @param tileTop   The world y of the top of the tile
 * @param slope     The slope of the tile
 * @param tileWidth The width of the tile
 * @param tileHeight The height of the tile
 * @param offsetX   The position along the tile, from its left edge (0 to its width)
 */
export function groundY(
  tileTop: number,
  slope: SlopeTile,
  tileWidth: number,
  tileHeight: number,
  offsetX: number
): number {
  const ratio = Math.min(Math.max(offsetX / tileWidth, 0), 1);
  const height = slope.left + (slope.right - slope.left) * ratio;

  return tileTop + tileHeight - height;
}

/** The ground a point stands on: its world y, and the tile it is in */
export interface Ground {
  y: number;
  column: number;
  row: number;
}

/**
 * Find the ground of the slopes below or around a point.
 *
 * It is the highest ground of the tile column of `x` which either is above
 * `y` and not further than `reach` (something to stick to when walking
 * down), or `y` is already inside the tile, under the line of the ground (so
 * `y` has to be lifted up to it).
 *
 * A point under a tile is not on it, but `reach` is allowed under the bottom
 * of the tile too: walking up a ramp the feet are, for a moment, a bit under
 * the bottom of the next tile, which starts where the previous one ended.
 *
 * @param field The slopes
 * @param x     The x of the point, in the world
 * @param y     The y of the point, in the world (the feet of the Player)
 * @param reach How far the ground can be below `y`
 * @param slack How far `y` can be below the bottom of the tile (default: `reach`)
 */
export function findGround(
  field: SlopeField,
  x: number,
  y: number,
  reach: number,
  slack: number = reach
): Ground | null {
  const { tileWidth, tileHeight, originX, originY } = field;

  const column = Math.floor((x - originX) / tileWidth);
  const firstRow = Math.floor((y - slack - originY) / tileHeight) - 1;
  const lastRow = Math.floor((y + reach - originY) / tileHeight);

  let best: Ground | null = null;

  for (let row = firstRow; row <= lastRow; row++) {
    const slope = field.getSlope(column, row);
    if (!slope) {
      continue;
    }

    const top = originY + row * tileHeight;
    const ground = groundY(
      top,
      slope,
      tileWidth,
      tileHeight,
      x - originX - column * tileWidth
    );

    const isInside = y >= ground && y <= top + tileHeight + slack;
    const isJustAbove = y < ground && ground - y <= reach;

    if ((isInside || isJustAbove) && (best === null || ground < best.y)) {
      best = { y: ground, column, row };
    }
  }

  return best;
}

export interface SlopeQuery {
  /** The x of the points under the body which stand on the ground */
  xs: readonly number[];
  /** The bottom of the body */
  feetY: number;
  velocityY: number;
  /** The body was on the ground in the previous step */
  wasGrounded: boolean;
  /**
   * How far it can stick to a slope going down, and how far under the bottom
   * of a tile it may be, when it was grounded
   */
  reachDown: number;
  /**
   * The most the points `xs` are away from the center of the body: a point
   * further out can be on a ground higher by `spread` times the steepness,
   * which the body has to be lifted to
   */
  spread?: number;
}

/**
 * Where the feet of a body have to be to stand on a slope.
 *
 * - A body going up (a jump) never touches the slope.
 * - A body inside a slope is lifted up to its ground.
 * - A body which was on the ground and now is just above a slope, as happens
 *   going down a ramp, is brought down to it, or it would take a small step
 *   in the air at every step.
 * - With more points, the highest ground wins.
 *
 * @return The y to put the feet at, or null if the body is not on a slope
 */
export function resolveSlope(
  field: SlopeField,
  query: SlopeQuery
): Ground | null {
  if (query.velocityY < 0) {
    return null;
  }

  const reach = query.wasGrounded ? query.reachDown : 0;
  const slack =
    reach + (query.spread ?? 0) * (field.tileHeight / field.tileWidth);
  let best: Ground | null = null;

  for (const x of query.xs) {
    const ground = findGround(field, x, query.feetY, reach, slack);

    if (ground && (best === null || ground.y < best.y)) {
      best = ground;
    }
  }

  return best;
}

/**
 * How far down a body moving at `velocityX` has to look to stay on a slope:
 * the steepest ground goes down as much as the tile is high over its width.
 *
 * @param velocityX  The x speed of the body, in pixels per second
 * @param delta      The time of the step, in seconds
 * @param steepness  The most the ground can go down per pixel (height / width)
 */
export function getReachDown(
  velocityX: number,
  delta: number,
  steepness: number
): number {
  // A couple of pixels more for the rounding of positions
  return Math.abs(velocityX) * delta * steepness + 2;
}

/**
 * Is a point inside the solid part of a slope tile (below its ground line)?
 * A bullet which is, has hit the slope.
 */
export function isInsideSlope(
  field: SlopeField,
  x: number,
  y: number
): boolean {
  const { tileWidth, tileHeight, originX, originY } = field;

  const column = Math.floor((x - originX) / tileWidth);
  const row = Math.floor((y - originY) / tileHeight);
  const slope = field.getSlope(column, row);

  if (!slope) {
    return false;
  }

  const top = originY + row * tileHeight;

  return (
    y >=
    groundY(top, slope, tileWidth, tileHeight, x - originX - column * tileWidth)
  );
}
