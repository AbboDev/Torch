/**
 * The cells of a map the Player has seen, with no dependency on Phaser. It is
 * a grid of bits, one for every tile of the map, and it is saved with the game
 * as text (see `encode`).
 */
export interface EncodedExplored {
  cols: number;
  rows: number;
  /** The bits, row after row, as base64 */
  bits: string;
}

/** A bound to what a wrong or malicious save can ask for */
const MAX_CELLS = 4_000_000;

const isSize = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

export class ExploredGrid {
  /** Goes up whenever a new cell is seen: a screen can tell it must redraw */
  public revision = 0;

  private readonly bits: Uint8Array;

  public constructor(
    public readonly cols: number,
    public readonly rows: number
  ) {
    this.bits = new Uint8Array(Math.ceil((cols * rows) / 8));
  }

  public has(col: number, row: number): boolean {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return false;
    }

    const index = row * this.cols + col;

    return (this.bits[index >> 3] & (1 << (index & 7))) !== 0;
  }

  /** @return True if the cell was not seen before */
  public reveal(col: number, row: number): boolean {
    if (this.has(col, row) || col < 0 || col >= this.cols) {
      return false;
    }

    if (row < 0 || row >= this.rows) {
      return false;
    }

    const index = row * this.cols + col;
    this.bits[index >> 3] |= 1 << (index & 7);
    this.revision++;

    return true;
  }

  /** The cells from (col0, row0) to (col1, row1), the last ones excluded */
  public revealRect(
    col0: number,
    row0: number,
    col1: number,
    row1: number
  ): void {
    for (let row = Math.max(0, row0); row < Math.min(this.rows, row1); row++) {
      for (let col = Math.max(0, col0); col < Math.min(this.cols, col1); col++) {
        this.reveal(col, row);
      }
    }
  }

  /** The cells whose center is at most `radius` cells from the center given */
  public revealCircle(centerCol: number, centerRow: number, radius: number): void {
    const reach = Math.ceil(radius);

    for (let row = centerRow - reach; row <= centerRow + reach; row++) {
      for (let col = centerCol - reach; col <= centerCol + reach; col++) {
        if (Math.hypot(col - centerCol, row - centerRow) <= radius) {
          this.reveal(col, row);
        }
      }
    }
  }

  public count(): number {
    let count = 0;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        count += this.has(col, row) ? 1 : 0;
      }
    }

    return count;
  }

  public encode(): EncodedExplored {
    let binary = "";
    for (const byte of this.bits) {
      binary += String.fromCharCode(byte);
    }

    return { cols: this.cols, rows: this.rows, bits: btoa(binary) };
  }

  /**
   * The grid of a map of `cols` x `rows` tiles, from what was saved.
   *
   * It trusts nothing: a wrong or missing save gives an empty grid. If the
   * map has changed in size since, the cells which are still in it stay as
   * they were, in the same column and row.
   */
  public static decode(
    data: unknown,
    cols: number,
    rows: number
  ): ExploredGrid {
    const grid = new ExploredGrid(cols, rows);
    const saved = data as Partial<EncodedExplored> | null | undefined;

    if (
      !isSize(saved?.cols) ||
      !isSize(saved?.rows) ||
      saved.cols * saved.rows > MAX_CELLS ||
      typeof saved.bits !== "string"
    ) {
      return grid;
    }

    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(saved.bits), (char) => char.charCodeAt(0));
    } catch {
      return grid;
    }

    if (bytes.length < Math.ceil((saved.cols * saved.rows) / 8)) {
      return grid;
    }

    for (let row = 0; row < Math.min(rows, saved.rows); row++) {
      for (let col = 0; col < Math.min(cols, saved.cols); col++) {
        const index = row * saved.cols + col;

        if ((bytes[index >> 3] & (1 << (index & 7))) !== 0) {
          grid.reveal(col, row);
        }
      }
    }

    // What is loaded is not new
    grid.revision = 0;

    return grid;
  }
}
