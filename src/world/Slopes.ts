import {
  SlopeGrid,
  getReachDown,
  isInsideSlope,
  resolveSlope,
} from "@/world/slopeGeometry";

/**
 * Where, under the body, the points which stand on the slopes are, measured
 * from its center. One point in the middle: the feet follow the ground under
 * the center of the body, which is how it looks right.
 *
 * With more points (for instance -8 and 8, the two sides of a body of 16) the
 * body stands on the highest ground of the points, so a corner never goes
 * into a ramp, but on a ramp the other side floats above it.
 */
export const FOOT_OFFSETS: readonly number[] = [0];

/** The part of an Arcade body which the slopes read and change */
export interface SlopeBody {
  enable: boolean;
  allowGravity: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: { x: number; y: number };
  wasTouching: { down: boolean };
  touching: { down: boolean; none: boolean };
  blocked: { down: boolean; none: boolean };
  updateCenter(): void;
}

/**
 * Keeps the bodies on the slopes of a map.
 *
 * Arcade Physics knows only boxes. After every step of the physics (when
 * the solid tiles have already done their work) a body standing on a slope
 * is put with its feet on the sloping ground and is told it is on the floor,
 * so the rest of the game, which asks `body.onFloor()`, works as usual.
 */
export class Slopes {
  private readonly bodies = new Set<SlopeBody>();

  private readonly cleanups: (() => void)[] = [];

  private readonly spread: number;

  public constructor(
    private readonly grid: SlopeGrid | null,
    private readonly footOffsets: readonly number[] = FOOT_OFFSETS
  ) {
    this.spread = Math.max(0, ...footOffsets.map(Math.abs));
  }

  /** There are slopes in the map */
  public get isEmpty(): boolean {
    return !this.grid || this.grid.size === 0;
  }

  /** The slopes, to draw them */
  public getGrid(): SlopeGrid | null {
    return this.grid;
  }

  /** Keep a body on the slopes (it must have gravity to be put on the ground) */
  public track(body: SlopeBody): void {
    this.bodies.add(body);
  }

  public untrack(body: SlopeBody): void {
    this.bodies.delete(body);
  }

  /** Is the point inside a slope, under its ground? (a bullet which hit it) */
  public isInside(x: number, y: number): boolean {
    return !!this.grid && isInsideSlope(this.grid, x, y);
  }

  /**
   * Call it after every step of the physics
   *
   * @param delta The duration of the step, in seconds
   */
  public step(delta: number): void {
    const { grid } = this;
    if (!grid || grid.size === 0) {
      return;
    }

    const steepness = grid.tileHeight / grid.tileWidth;

    for (const body of this.bodies) {
      // Without gravity (hanging, on a ladder) the body is not on the ground
      if (!body.enable || !body.allowGravity) {
        continue;
      }

      const centerX = body.x + body.width / 2;

      const ground = resolveSlope(grid, {
        xs: this.footOffsets.map((offset) => centerX + offset),
        feetY: body.y + body.height,
        velocityY: body.velocity.y,
        wasGrounded: body.wasTouching.down,
        reachDown: getReachDown(body.velocity.x, delta, steepness),
        spread: this.spread,
      });

      if (!ground) {
        continue;
      }

      body.y = ground.y - body.height;
      body.velocity.y = 0;
      body.blocked.down = true;
      body.blocked.none = false;
      body.touching.down = true;
      body.touching.none = false;
      body.updateCenter();
    }
  }

  /** Run something when the slopes are destroyed (stop listening to the world) */
  public onDestroy(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  public destroy(): void {
    this.cleanups.splice(0).forEach((cleanup) => cleanup());
    this.bodies.clear();
  }
}
