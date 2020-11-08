/**
 * The three possible orientations along the Y axis
 */
export enum DirectionAxisY {
  UP = 'up',
  DOWN = 'down',
  MIDDLE = 'middle'
};

/**
 * The three possible orientations along the X axis
 */
export enum DirectionAxisX {
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center'
};

/**
 * A game object should have both
 */
export interface Facing {
  x: null | DirectionAxisX,
  y: null | DirectionAxisY
};

/**
 * From the given direction, it return the sign for move along the X axis
 *
 * @param  {DirectionAxisX | null} directionX The incoming direction
 *
 * @return {number}                The sign of the movement
 */
export function getSignX(directionX: DirectionAxisX | null): number {
  if (directionX === DirectionAxisX.RIGHT) {
    return 1;
  }

  if (directionX === DirectionAxisX.LEFT) {
    return -1;
  }

  return 0;
}

/**
 * From the given direction, it return the sign for move along the Y axis
 *
 * @param  {DirectionAxisY | null} directionY The incoming direction
 *
 * @return {number}                The sign of the movement
 */
export function getSignY(directionY: DirectionAxisY | null): number {
  if (directionY === DirectionAxisY.DOWN) {
    return 1;
  }

  if (directionY === DirectionAxisY.UP) {
    return -1;
  }

  return 0;
}

/**
 * From the given directions, it return the signs for move along both axes
 *
 * @param  {DirectionAxisY | null} directionY The incoming direction
 *
 * @return {number}                The sign of the movement
 */
export function getSign(facing: Facing): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(
    getSignX(facing.x),
    getSignY(facing.y)
  );
}
