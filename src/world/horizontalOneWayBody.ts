import { DirectionAxisX } from "@/miscellaneous/Direction";
import type { OneWayDirection } from "@/world/oneWayTiles";

/** The parts of a Phaser Arcade body this needs, for testability */
export interface OneWayBodyLike {
  velocity: { x: number; y: number };
  blocked: { none: () => void };
  checkCollision: { left: boolean; right: boolean };
}

/**
 * Read the Tiled property `oneWayDirection` of a tile: it can come from the
 * tileset (shared by all its tiles) or from the tile itself (only that
 * placement). A value which is not one of the four directions is ignored.
 */
export function readOneWayDirection(
  properties: Record<string, unknown> | undefined
): OneWayDirection | null {
  const value = properties?.oneWayDirection;

  if (
    value === "up" ||
    value === "down" ||
    value === "left" ||
    value === "right"
  ) {
    return value;
  }

  return null;
}

/**
 * Which side of a tile the body presses against: the side its center is on.
 * A body whose center is left of the tile's center comes from the left and
 * presses the left face of the passage — so a "left" one-way tile (solid
 * against movements to the left) must block it there.
 */
export function getApproachingSide(
  bodyCenterX: number,
  tileCenterX: number
): "left" | "right" {
  return bodyCenterX < tileCenterX ? "left" : "right";
}

/**
 * Update the collision flags of the body for the horizontal one-way tiles.
 *
 * Phaser's tile processor separates bodies on both axes at once, so letting
 * the Player pass through a vertical one-way wall while keeping it solid
 * under every other movement is done by disabling the horizontal checks of
 * the body for the frames where it may pass through. It must be done before
 * the physics step: hence preUpdate.
 *
 * The rule mirrors what the platforms do vertically:
 * - falling or standing on something: the walls stay solid (the Player can
 *   land on them, lean on them, grab their edge);
 * - moving up freely (a jump, a double jump, a grapple climb): the wall does
 *   not block the side the Player looks at, so it can jump through it; the
 *   other side stays solid, so it can never be pushed back the way it came.
 *
 * @param body      The Phaser body of the Player
 * @param facingX   Facing of the Player: -1 looks left, +1 looks right, 0 neither
 * @param isOnFloor Whether the Player stands on something
 */
export function updateHorizontalOneWayFlags(
  body: OneWayBodyLike,
  facingX: number,
  isOnFloor: boolean
): void {
  // Reset only the sides: blocked.up/down are used by the slopes and the
  // platforms, and touching is read by the sensors
  body.blocked.none();

  const mayPassThrough = body.velocity.y < 0 && !isOnFloor;

  body.checkCollision.left = !(mayPassThrough && facingX === DirectionAxisX.LEFT);
  body.checkCollision.right = !(
    mayPassThrough && facingX === DirectionAxisX.RIGHT
  );
}
