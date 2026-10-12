/**
 * Which tiles the Player collides with. No dependency on Phaser.
 *
 * Most tiles are solid. Two layers are not, to be passed through from below:
 * - "platforms": solid only for a Player which is above them (it can jump up
 *   through);
 * - "stairs": the top of a stair, like a platform, but the Player can also
 *   drop through it with the down button; and only the top tile of a stair
 *   (the ones with another tile above are only to be climbed).
 */
export interface TileCollisionQuery {
  /** The name of the layer of the tile */
  layer: string;
  index: number;
  /** The y of the top of the tile */
  tileTop: number;
  /** Asked only when needed */
  feetBottom(): number;
  isDownPressed(): boolean;
  hasTileAbove(): boolean;
}

export function collidesWithTile(query: TileCollisionQuery): boolean {
  switch (query.layer) {
    case "platforms":
      return query.index >= 0 && query.feetBottom() - 1 < query.tileTop;

    case "stairs":
      if (
        query.index >= 0 &&
        query.feetBottom() - 1 < query.tileTop &&
        !query.hasTileAbove()
      ) {
        return !query.isDownPressed();
      }

      return false;

    default:
      return query.index >= 0;
  }
}
