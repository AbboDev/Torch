import {
  SlopeGrid,
  findGround,
  getReachDown,
  isInsideSlope,
  resolveSlope,
} from "@/world/slopeGeometry";

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

  /** Bodies whose last ground was a slope */
  private readonly groundedBodies = new Set<SlopeBody>();

  private readonly cleanups: (() => void)[] = [];

  private readonly spread: number;

  public constructor(
    private readonly grid: SlopeGrid | null,
    private readonly footOffsets: readonly number[] | null = null
  ) {
    this.spread = Math.max(0, ...(footOffsets ?? []).map(Math.abs));
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
    this.groundedBodies.delete(body);
  }

  /** Is the point inside a slope, under its ground? (a bullet which hit it) */
  public isInside(x: number, y: number): boolean {
    return !!this.grid && isInsideSlope(this.grid, x, y);
  }

  /** The slope ground near the feet, or null. Used to recognise a lip */
  public groundAt(x: number, feetY: number): number | null {
    const { grid } = this;
    if (!grid) {
      return null;
    }

    return (
      findGround(grid, x, feetY, grid.tileHeight, grid.tileHeight)?.y ?? null
    );
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
        this.groundedBodies.delete(body);
        continue;
      }

      const centerX = body.x + body.width / 2;
      const half = body.width / 2;
      // Both sides, kept just inside the body: the exact edge belongs to the
      // next tile. The higher side wins, so the body stays on a flat tile
      // while the other side is already over a lower slope.
      const inset = Math.min(0.5, half);
      const wasSlopeGrounded = this.groundedBodies.has(body);

      const feetY = body.y + body.height;
      const query = {
        feetY,
        velocityY: body.velocity.y,
        wasGrounded:
          body.wasTouching.down ||
          body.touching.down ||
          body.blocked.down ||
          wasSlopeGrounded,
        reachDown: getReachDown(body.velocity.x, delta, steepness),
        spread: Math.max(this.spread, half),
      };
      const side = resolveSlope(grid, {
        ...query,
        xs: this.footOffsets
          ? this.footOffsets.map((offset) => centerX + offset)
          : [centerX - half + inset, centerX + half - inset],
      });
      const center = resolveSlope(grid, { ...query, xs: [centerX] });
      // The higher side in front means the body is climbing. Follow the
      // center, or it jumps onto the crest and wedges into the tile above.
      // The higher side behind is a descent: stay on it.
      const climbing =
        side !== null &&
        center !== null &&
        body.velocity.x !== 0 &&
        side.y < center.y - 0.5 &&
        Math.sign(side.column - center.column) === Math.sign(body.velocity.x);
      const ground = climbing ? center : side;

      if (!ground) {
        this.groundedBodies.delete(body);
        continue;
      }

      this.groundedBodies.add(body);
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
    this.groundedBodies.clear();
  }
}
