// The real Arcade Physics integration, so tests of the movement use the same
// rules as the game instead of a copy of them.
import World from "../../node_modules/phaser/src/physics/arcade/World.js";

class Vector {
  public constructor(
    public x = 0,
    public y = 0
  ) {}

  public set(x: number, y = x): this {
    this.x = x;
    this.y = y;

    return this;
  }
}

export interface FakeBody {
  velocity: Vector;
  acceleration: Vector;
  drag: Vector;
  maxVelocity: Vector;
  speed: number;
  maxSpeed: number;
  allowDrag: boolean;
  useDamping: boolean;
  allowGravity: boolean;
  gravity: Vector;
  /** Position, integrated by `step` */
  x: number;
  y: number;
}

export function createBody(options: Partial<FakeBody> = {}): FakeBody {
  return {
    velocity: new Vector(),
    acceleration: new Vector(),
    drag: new Vector(),
    maxVelocity: new Vector(10000, 10000),
    speed: 0,
    maxSpeed: -1,
    allowDrag: true,
    useDamping: false,
    allowGravity: false,
    gravity: new Vector(),
    x: 0,
    y: 0,
    ...options,
  };
}

export const Vec = Vector;

const world = Object.create(World.prototype);
world.gravity = new Vector();

/** One physics step of Arcade Physics (60 steps per second by default) */
export function step(body: FakeBody, delta = 1 / 60): void {
  world.computeVelocity(body, delta);
  body.x += body.velocity.x * delta;
  body.y += body.velocity.y * delta;
}

/** Run steps until `until` is true; returns the elapsed seconds (or Infinity) */
export function run(
  body: FakeBody,
  until: (body: FakeBody) => boolean,
  maxSeconds = 60
): number {
  const delta = 1 / 60;

  for (let frame = 1; frame <= maxSeconds * 60; frame++) {
    step(body, delta);

    if (until(body)) {
      return frame * delta;
    }
  }

  return Infinity;
}
