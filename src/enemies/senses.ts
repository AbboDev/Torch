import type { Heading, PatrolSenses, SideSense } from "@/enemies/patrol";

/**
 * What an enemy which walks feels of the ground, with no dependency on Phaser:
 * it looks at points of the world and asks what is there. The scene tells what
 * is there (`TerrainProbe`), so the same rules work for any map.
 */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface TerrainProbe {
  /** Something which stops a walker at this point: a wall */
  isWall(x: number, y: number): boolean;
  /** Something to stand on at this point: ground, a platform, a slope */
  isGround(x: number, y: number): boolean;
}

/** How far beyond the body the ground is looked for, in pixels */
export const LOOKAHEAD = 2;

/** How far under the feet, in pixels */
export const FOOT_REACH = 2;

/** The heights of the body where a wall is looked for, from its top to its bottom */
const WALL_HEIGHTS = [0.1, 0.5, 0.9];

/**
 * What the enemy feels at one side of its body: a wall touching it, at any
 * height; and the ground under the next step, just beyond its edge.
 *
 * @param blocked The physics already knows it is stopped by something there
 */
export function senseSide(
  box: Box,
  heading: Heading,
  probe: TerrainProbe,
  blocked = false
): SideSense {
  const edge = heading === 1 ? box.right : box.left;
  const height = box.bottom - box.top;

  const wall =
    blocked ||
    WALL_HEIGHTS.some((part) =>
      probe.isWall(edge + heading, box.top + height * part)
    );

  return {
    wall,
    ground: probe.isGround(edge + heading * LOOKAHEAD, box.bottom + FOOT_REACH),
  };
}

/** What the enemy feels at both sides, for a brain which patrols */
export function sensePatrol(
  box: Box,
  probe: TerrainProbe,
  onGround: boolean,
  blocked: { left: boolean; right: boolean } = { left: false, right: false }
): PatrolSenses {
  return {
    onGround,
    left: senseSide(box, -1, probe, blocked.left),
    right: senseSide(box, 1, probe, blocked.right),
  };
}
