export interface LedgeClimbQuery {
  /** The wall the Player runs against is on the left */
  isLeft: boolean;
  /** The center of the body of the Player, in the world */
  centerX: number;
  centerY: number;
  tileSize: number;
  /** Is there a tile of the world in this column and row of the map? */
  hasTile(column: number, row: number): boolean;
}

export interface ClimbRoomQuery {
  /** The final bounds of the Player's body */
  x: number;
  y: number;
  width: number;
  height: number;
  tileSize: number;
  /** Is there a blocking tile in this column and row of the map? */
  hasTile(column: number, row: number): boolean;
}

/**
 * Running against a wall: is it a ledge the Player can climb onto? It is when,
 * in the column of the wall, there is a tile at the level of the feet and none
 * at the level of the body above it (so there is room to stand on top).
 * No dependency on Phaser.
 */
export function hasLedgeToClimb(query: LedgeClimbQuery): boolean {
  const { isLeft, centerX, centerY, tileSize, hasTile } = query;

  const x = isLeft ? centerX - tileSize : centerX + tileSize;
  const column = Math.floor(x / tileSize);
  const row = Math.floor((centerY - 1) / tileSize);

  return !hasTile(column, row) && hasTile(column, row + 1);
}

/** Whether every tile touched by the final body position is empty */
export function hasRoomToClimb(query: ClimbRoomQuery): boolean {
  const { x, y, width, height, tileSize, hasTile } = query;
  const left = Math.floor(x / tileSize);
  const right = Math.ceil((x + width) / tileSize) - 1;
  const top = Math.floor(y / tileSize);
  const bottom = Math.ceil((y + height) / tileSize) - 1;

  for (let row = top; row <= bottom; row++) {
    for (let column = left; column <= right; column++) {
      if (hasTile(column, row)) {
        return false;
      }
    }
  }

  return true;
}
