/**
 * Which tiles the Player collides with. No dependency on Phaser.
 *
 * Most tiles are solid. Three kinds of one-way tiles are not, to be passed
 * through from the side they do not block:
 * - "platforms": solid only for a Player which is above them (it can jump up
 *   through);
 * - "stairs": the top of a stair, like a platform, but the Player can also
 *   drop through it with the down button; and only the top tile of a stair
 *   (the ones with another tile above are only to be climbed);
 * - tiles with the Tiled property `oneWayDirection` (on any layer):
 *   - "left" / "right": horizontal one-way collisions, the mirror image of a
 *     platform — solid only against a Player which presses on their blocking
 *     face (see `approachingFrom`), pass-through from the other side;
 *   - "up" behaves like a platform, "down" like its vertical mirror (a
 *     ceiling jumped through from below).
 */
export type OneWayDirection = "up" | "down" | "left" | "right";

export interface TileCollisionQuery {
  /** The name of the layer of the tile */
  layer: string;
  index: number;
  /** The x of the left of the tile */
  tileLeft?: number;
  /** The x of the right of the tile */
  tileRight?: number;
  /** The y of the top of the tile */
  tileTop: number;
  /** The y of the bottom of the tile */
  tileBottom?: number;
  /** Asked only when needed */
  feetBottom(): number;
  /** The y of the top of the body, asked only when it has to be */
  headTop?(): number;
  /**
   * Which side of the tile the body presses against: "left" if its center is
   * to the left of the tile's center (it comes from the left), "right"
   * otherwise. Asked only by the horizontal one-way tiles.
   */
  approachingFrom?(): "left" | "right";
  /**
   * The Tiled property `oneWayDirection` of the tile (tileset or tile
   * property), or null if there is none. Asked only for the layers which are
   * not one-way by themselves.
   */
  oneWayDirection?(): OneWayDirection | null;
  isDownPressed(): boolean;
  hasTileAbove(): boolean;
}

/**
 * Is a horizontal one-way tile solid? A "left" tile blocks a Player pressing
 * against its right face (coming from the left) — it can walk into it, lean
 * on it, grab its edge; and lets it pass coming from the right. A "right"
 * tile mirrors that. Like a platform only presses matter: being inside the
 * tile without pressing on the blocking face passes through.
 */
function collidesHorizontally(
  direction: "left" | "right",
  query: TileCollisionQuery
): boolean {
  const comingFrom = query.approachingFrom ? query.approachingFrom() : null;

  return direction === "left" ? comingFrom === "left" : comingFrom === "right";
}

export function collidesWithTile(query: TileCollisionQuery): boolean {
  if (query.index < 0) {
    return false;
  }

  switch (query.layer) {
    case "platforms":
      return query.feetBottom() - 1 < query.tileTop;

    case "stairs":
      if (query.feetBottom() - 1 < query.tileTop && !query.hasTileAbove()) {
        return !query.isDownPressed();
      }

      return false;

    default: {
      const direction = query.oneWayDirection ? query.oneWayDirection() : null;

      switch (direction) {
        case "left":
        case "right":
          return collidesHorizontally(direction, query);

        case "up":
          return query.feetBottom() - 1 < query.tileTop;

        case "down": {
          const headTop = query.headTop ? query.headTop() : 0;
          const tileBottom = query.tileBottom ?? query.tileTop;

          return headTop + 1 <= tileBottom;
        }

        default:
          return true;
      }
    }
  }
}
