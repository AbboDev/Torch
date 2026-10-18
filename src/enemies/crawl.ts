/**
 * How an enemy crawls along any surface, with no dependency on Phaser: on the
 * floor, up a wall, along the ceiling, and round the corners, like the
 * Zoomers of Metroid. It works on the cells of the map (a tile each): the
 * enemy is in a cell, with a surface it clings to and a way it goes along it.
 *
 *     surface: the side of the cell where the wall, the floor or the ceiling is
 *     heading: the way it goes, along the surface (never towards or away from it)
 *
 * It goes on cell by cell: at a wall in the way (an inner corner) it turns to
 * go up the wall; where the surface ends (an outer corner) it goes round it.
 */

/** A direction of one cell: each part is -1, 0 or 1, and only one is not 0 */
export interface Step {
  x: number;
  y: number;
}

export const LEFT: Step = { x: -1, y: 0 };
export const RIGHT: Step = { x: 1, y: 0 };
export const UP: Step = { x: 0, y: -1 };
export const DOWN: Step = { x: 0, y: 1 };

/** The four directions, in the order in which a surface is looked for */
export const STEPS: readonly Step[] = [DOWN, LEFT, RIGHT, UP];

/** Where the enemy is, and how it clings to the map and goes along it */
export interface Crawl {
  col: number;
  row: number;
  surface: Step;
  heading: Step;
}

/** What the map has in a cell: the scene tells it */
export interface CellGrid {
  /** There is a wall, a floor or a ceiling in the cell: something to cling to */
  isSolid(col: number, row: number): boolean;
}

export function negate(step: Step): Step {
  return { x: step.x === 0 ? 0 : -step.x, y: step.y === 0 ? 0 : -step.y };
}

export function sameStep(a: Step, b: Step): boolean {
  return a.x === b.x && a.y === b.y;
}

/** The two go along different lines: a surface and the way along it */
export function arePerpendicular(a: Step, b: Step): boolean {
  return a.x * b.x + a.y * b.y === 0;
}

/** The way along a surface when none was chosen: left on a floor, up on a wall */
export function getDefaultHeading(surface: Step): Step {
  return surface.y !== 0 ? LEFT : UP;
}

const isSolidBeside = (grid: CellGrid, cell: Crawl, step: Step): boolean =>
  grid.isSolid(cell.col + step.x, cell.row + step.y);

/**
 * Cling to something around a cell: the surface wanted if it is there, else
 * the first which is (floor, left, right, ceiling). Null if there is nothing,
 * and the enemy falls.
 *
 * @param preferred The surface and the way wanted, if any
 */
export function attach(
  cell: { col: number; row: number },
  grid: CellGrid,
  preferred: { surface?: Step; heading?: Step } = {}
): Crawl | null {
  const candidates = preferred.surface
    ? [preferred.surface, ...STEPS]
    : [...STEPS];

  for (const surface of candidates) {
    if (grid.isSolid(cell.col + surface.x, cell.row + surface.y)) {
      const heading =
        preferred.heading && arePerpendicular(preferred.heading, surface)
          ? preferred.heading
          : getDefaultHeading(surface);

      return { col: cell.col, row: cell.row, surface, heading };
    }
  }

  return null;
}

/**
 * Where the enemy goes next: one or two cells, each with the way it clings
 * and goes when it gets there. Nothing if it is boxed in.
 *
 * - A wall in the way (an inner corner): it turns up the wall, so the wall is
 *   the surface and the way is away from the old one, before it moves.
 * - It moves to the next cell. If the surface does not go on there (an outer
 *   corner) it goes on to the cell beside the end of the surface, where the end
 *   is the surface now and the way is where the old surface was.
 */
export function getWaypoints(state: Crawl, grid: CellGrid): Crawl[] {
  let { surface, heading } = state;

  // At most four turns: more is boxed in (the four sides are walls)
  for (let turns = 0; turns < 4; turns++) {
    if (!isSolidBeside(grid, { ...state, surface, heading }, heading)) {
      break;
    }

    [surface, heading] = [heading, negate(surface)];

    if (turns === 3) {
      return [];
    }
  }

  const ahead = {
    col: state.col + heading.x,
    row: state.row + heading.y,
    surface,
    heading,
  };

  if (isSolidBeside(grid, ahead, surface)) {
    return [ahead];
  }

  // The surface ends: round the corner, to the cell beside its end
  return [
    ahead,
    {
      col: ahead.col + surface.x,
      row: ahead.row + surface.y,
      surface: negate(heading),
      heading: surface,
    },
  ];
}
