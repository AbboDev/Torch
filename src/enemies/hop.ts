import type { EnemyBrain, Heading } from "@/enemies/patrol";

/**
 * How an enemy hops, with no dependency on Phaser: it jumps at regular
 * intervals, goes forward in the air, and where it hits a wall it turns round
 * and comes back. It does not look for holes: it can fall in them, and it
 * jumps again where it lands.
 */
export interface HopSenses {
  /** The enemy stands on the ground: it can only jump from there */
  onGround: boolean;
  /** There is a wall touching its left or its right */
  wallLeft: boolean;
  wallRight: boolean;
  /** The time of the game, in milliseconds */
  time: number;
}

export interface HopIntent {
  heading: Heading;
  /** Which way it goes sideways: 0 while it waits on the ground */
  direction: -1 | 0 | 1;
  /** Jump now */
  jump: boolean;
}

/**
 * How fast to go up to jump to a height, with a gravity: the speed at which
 * the climb ends just there.
 *
 * @param gravity The gravity, in pixels for a second for a second
 * @param height  The height of the jump, in pixels
 */
export function getJumpSpeed(gravity: number, height: number): number {
  return Math.sqrt(2 * gravity * height);
}

/**
 * The brain of an enemy which hops. It jumps once every `interval`
 * milliseconds, counted from the last jump (the first from when it starts to
 * think); if it is in the air at the time it jumps as soon as it lands.
 */
export class HopBrain implements EnemyBrain<HopSenses, HopIntent> {
  private nextJumpAt: number | null = null;

  /**
   * @param heading  Where it goes first
   * @param interval Milliseconds between two jumps
   */
  public constructor(
    public heading: Heading,
    private readonly interval: number
  ) {}

  public think(senses: HopSenses): HopIntent {
    const { onGround, wallLeft, wallRight, time } = senses;

    const ahead = this.heading === 1 ? wallRight : wallLeft;
    const behind = this.heading === 1 ? wallLeft : wallRight;

    // A wall in the way: back. If the way back is a wall too, it stays between them.
    const isBoxedIn = ahead && behind;
    if (ahead && !behind) {
      this.heading = this.heading === 1 ? -1 : 1;
    }

    this.nextJumpAt ??= time + this.interval;

    let jump = false;
    if (onGround && time >= this.nextJumpAt) {
      jump = true;
      this.nextJumpAt = time + this.interval;
    }

    // On the ground it waits; once it is off, up or down, it goes forward
    const isOff = jump || !onGround;

    return {
      heading: this.heading,
      direction: isOff && !isBoxedIn ? this.heading : 0,
      jump,
    };
  }
}
