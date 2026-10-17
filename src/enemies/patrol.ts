/**
 * How an enemy patrols along a line, with no dependency on Phaser: it walks
 * on until the way is blocked, then goes back. It is the decision only (what
 * the senses tell, which way to go), so any enemy which walks can use it and
 * the rules can be tested without a game.
 */

/** Which way along the line: -1 is left, 1 is right */
export type Heading = -1 | 1;

/** What an enemy feels on one side of it */
export interface SideSense {
  /** There is a wall in the way */
  wall: boolean;
  /** There is ground under the next step: false is a hole */
  ground: boolean;
}

export interface PatrolSenses {
  /** The enemy stands on the ground: in the air it can not tell anything */
  onGround: boolean;
  left: SideSense;
  right: SideSense;
}

export interface PatrolDecision {
  heading: Heading;
  /** False when the enemy is boxed in and stays where it is */
  moving: boolean;
}

/** A wall or a hole: it does not go that way */
const isBlocked = (side: SideSense): boolean => side.wall || !side.ground;

export function getOpposite(heading: Heading): Heading {
  return heading === 1 ? -1 : 1;
}

/**
 * Walk on while the way is free; at a wall or a hole turn back; if the way
 * back is blocked too, stay. In the air (falling, pushed) it goes on as it was:
 * what is under the next step does not matter until it lands.
 */
export function stepPatrol(
  heading: Heading,
  senses: PatrolSenses
): PatrolDecision {
  if (!senses.onGround) {
    return { heading, moving: true };
  }

  const ahead = heading === 1 ? senses.right : senses.left;
  const behind = heading === 1 ? senses.left : senses.right;

  if (!isBlocked(ahead)) {
    return { heading, moving: true };
  }

  if (!isBlocked(behind)) {
    return { heading: getOpposite(heading), moving: true };
  }

  return { heading, moving: false };
}

/** What an enemy thinks with: what it senses in, what it wants to do out */
export interface EnemyBrain<Senses, Intent> {
  think(senses: Senses, delta: number): Intent;
}

/**
 * The brain of an enemy which walks back and forth. Others (one which chases,
 * one which flies) are other brains with their own senses and intent.
 */
export class PatrolBrain implements EnemyBrain<PatrolSenses, PatrolDecision> {
  public constructor(public heading: Heading = -1) {}

  public think(senses: PatrolSenses): PatrolDecision {
    const decision = stepPatrol(this.heading, senses);

    this.heading = decision.heading;

    return decision;
  }
}
