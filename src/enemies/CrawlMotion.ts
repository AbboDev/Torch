import {
  CellGrid,
  Crawl,
  DOWN,
  Step,
  attach,
  getWaypoints,
} from "@/enemies/crawl";

/** How much faster than it crawls the enemy falls, when it loses its surface */
const FALL_FACTOR = 4;

/** More work than this in a frame is a mistake, not a long frame */
const MAX_WAYPOINTS_PER_ADVANCE = 100;

/** Sums of small distances are not exact: this close to a waypoint is there */
const ARRIVAL_TOLERANCE = 1e-9;

/**
 * The movement of a crawling enemy, with no dependency on Phaser: it goes
 * from cell to cell along the path `getWaypoints` gives, at a speed in cells
 * for a second, and tells where it is between two cells and how it clings.
 * If what it clings to goes away (a block which is broken) it falls, and
 * clings to what it lands on.
 */
export class CrawlMotion {
  /** The waypoint the enemy left last: where it is, and how it clings */
  private from: Crawl;

  /** The waypoints it is going to, the first one is next */
  private queue: Crawl[] = [];

  /** How far it is from `from` to the first of the queue, from 0 to 1 */
  private progress = 0;

  private isFalling = false;

  /**
   * @param cell      The cell it starts in
   * @param grid      What the map has in every cell
   * @param preferred The surface and the way wanted when it starts
   */
  public constructor(
    cell: { col: number; row: number },
    private readonly grid: CellGrid,
    preferred: { surface?: Step; heading?: Step } = {}
  ) {
    const attached = attach(cell, grid, preferred);

    this.isFalling = attached === null;
    this.from = attached ?? {
      col: cell.col,
      row: cell.row,
      surface: DOWN,
      heading: preferred.heading ?? { x: -1, y: 0 },
    };
  }

  /**
   * How it clings when it is moving is how it will cling when it gets there:
   * it turns at the start of a move (at an inner corner before it goes up the
   * wall, at an outer one before it goes down the end), not at the end.
   */
  private get current(): Crawl {
    return this.progress > 0 && this.queue.length > 0
      ? this.queue[0]
      : this.from;
  }

  /** The surface it clings to */
  public get surface(): Step {
    return this.current.surface;
  }

  /** The way it goes along the surface */
  public get heading(): Step {
    return this.current.heading;
  }

  public get falling(): boolean {
    return this.isFalling;
  }

  /** Where the middle of the enemy is, in cells: 0.5 is the middle of the cell 0 */
  public get position(): { x: number; y: number } {
    const to = this.queue[0] ?? this.from;

    return {
      x: this.from.col + (to.col - this.from.col) * this.progress + 0.5,
      y: this.from.row + (to.row - this.from.row) * this.progress + 0.5,
    };
  }

  /**
   * Go on.
   *
   * @param cells How far it crawls: the speed times the time
   */
  public advance(cells: number): void {
    let budget = cells;

    for (
      let work = 0;
      budget > ARRIVAL_TOLERANCE && work < MAX_WAYPOINTS_PER_ADVANCE;
      work++
    ) {
      if (this.queue.length === 0 && !this.plan()) {
        return;
      }

      const pace = this.isFalling ? FALL_FACTOR : 1;
      const needed = (1 - this.progress) / pace;

      if (budget + ARRIVAL_TOLERANCE >= needed) {
        budget -= needed;
        this.from = this.queue.shift() as Crawl;
        this.progress = 0;

        // It has landed when there is something under it
        if (
          this.isFalling &&
          this.grid.isSolid(this.from.col, this.from.row + 1)
        ) {
          this.isFalling = false;
        }
      } else {
        this.progress += budget * pace;
        budget = 0;
      }
    }
  }

  /** Decide where to go from the cell it is in: false if it can not go anywhere */
  private plan(): boolean {
    const solidBeside = this.grid.isSolid(
      this.from.col + this.from.surface.x,
      this.from.row + this.from.surface.y
    );

    if (!solidBeside) {
      // What it clung to is gone: cling to something else, or fall
      const attached = attach(this.from, this.grid, this.from);

      if (!attached) {
        this.isFalling = true;
        this.queue = [
          { ...this.from, row: this.from.row + 1, surface: DOWN },
        ];

        return true;
      }

      this.from = attached;
    }

    this.isFalling = false;
    this.queue = getWaypoints(this.from, this.grid);

    return this.queue.length > 0;
  }
}
