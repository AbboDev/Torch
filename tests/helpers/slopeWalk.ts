import { SlopeField, getReachDown, resolveSlope } from "@/world/slopes";

/** One step of a body walking, as the game does it with Arcade Physics */
export interface WalkState {
  x: number;
  feetY: number;
  vx: number;
  vy: number;
  /** The body is on the floor or on a slope at the end of the step */
  grounded: boolean;
  onSlope: boolean;
}

export const GRAVITY = 512;

export interface WalkOptions {
  /** A flat solid floor: the feet can't go below it (a normal tile of Arcade) */
  floorY?: (x: number) => number | null;
  /** The x of the points of the body which stand on the slopes, from its center */
  offsets?: number[];
  /** The most the points are away from the center */
  spread?: number;
  delta?: number;
}

/**
 * The same order of the game: gravity and movement, then the solid tiles
 * (Arcade colliders), then the slopes (after the world step).
 */
export function walkStep(
  field: SlopeField,
  state: WalkState,
  options: WalkOptions = {}
): WalkState {
  const delta = options.delta ?? 1 / 60;
  const wasGrounded = state.grounded;

  let vy = state.vy + GRAVITY * delta;
  const x = state.x + state.vx * delta;
  let feetY = state.feetY + vy * delta;
  let grounded = false;

  const floor = options.floorY?.(x) ?? null;
  if (floor !== null && feetY >= floor) {
    feetY = floor;
    vy = 0;
    grounded = true;
  }

  const ground = resolveSlope(field, {
    xs: (options.offsets ?? [0]).map((offset) => x + offset),
    feetY,
    velocityY: vy,
    wasGrounded,
    spread: options.spread,
    reachDown: getReachDown(
      state.vx,
      delta,
      field.tileHeight / field.tileWidth
    ),
  });

  if (ground) {
    feetY = ground.y;
    vy = 0;
    grounded = true;
  }

  return { x, feetY, vx: state.vx, vy, grounded, onSlope: ground !== null };
}

export function walk(
  field: SlopeField,
  start: Partial<WalkState> & { x: number; feetY: number },
  steps: number,
  options: WalkOptions = {}
): WalkState[] {
  let state: WalkState = {
    vx: 0,
    vy: 0,
    grounded: true,
    onSlope: false,
    ...start,
  };
  const states: WalkState[] = [];

  for (let step = 0; step < steps; step++) {
    state = walkStep(field, state, options);
    states.push(state);
  }

  return states;
}
