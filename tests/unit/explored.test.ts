import { describe, expect, it } from "vitest";
import { ExploredGrid } from "@/world/explored";

describe("ExploredGrid", () => {
  it("starts with nothing seen", () => {
    const grid = new ExploredGrid(10, 5);

    expect(grid.count()).toBe(0);
    expect(grid.has(3, 2)).toBe(false);
  });

  it("reveals a cell once, and says if it was new", () => {
    const grid = new ExploredGrid(10, 5);

    expect(grid.reveal(3, 2)).toBe(true);
    expect(grid.reveal(3, 2)).toBe(false);
    expect(grid.has(3, 2)).toBe(true);
    expect(grid.count()).toBe(1);
  });

  it("ignores what is outside the map", () => {
    const grid = new ExploredGrid(10, 5);

    expect(grid.reveal(-1, 0)).toBe(false);
    expect(grid.reveal(10, 0)).toBe(false);
    expect(grid.reveal(0, 5)).toBe(false);
    expect(grid.has(10, 0)).toBe(false);
    expect(grid.count()).toBe(0);
  });

  it("counts the changes, so a screen knows when to redraw", () => {
    const grid = new ExploredGrid(10, 5);

    grid.reveal(1, 1);
    grid.reveal(1, 1);
    grid.reveal(2, 1);

    expect(grid.revision).toBe(2);
  });

  it("reveals a rectangle, cut at the borders of the map", () => {
    const grid = new ExploredGrid(10, 5);

    grid.revealRect(-3, -3, 2, 2);

    expect(grid.count()).toBe(4);
    expect(grid.has(1, 1)).toBe(true);
    expect(grid.has(2, 1)).toBe(false);
  });

  it("reveals a circle", () => {
    const grid = new ExploredGrid(20, 20);

    grid.revealCircle(10, 10, 3);

    expect(grid.has(10, 10)).toBe(true);
    expect(grid.has(13, 10)).toBe(true);
    expect(grid.has(14, 10)).toBe(false);
    expect(grid.has(12, 12)).toBe(true);
    // the corner of the square around it is too far
    expect(grid.has(13, 13)).toBe(false);
  });

  it("is saved as text and comes back the same", () => {
    const grid = new ExploredGrid(13, 7);
    grid.revealRect(2, 1, 9, 4);
    grid.reveal(12, 6);

    const back = ExploredGrid.decode(
      JSON.parse(JSON.stringify(grid.encode())),
      13,
      7
    );

    expect(back.count()).toBe(grid.count());
    expect(back.has(12, 6)).toBe(true);
    expect(back.has(1, 1)).toBe(false);
    expect(back.revision).toBe(0);
  });

  it("keeps the cells which are still in a map which has changed in size", () => {
    const grid = new ExploredGrid(10, 5);
    grid.reveal(2, 1);
    grid.reveal(9, 4);

    const bigger = ExploredGrid.decode(grid.encode(), 20, 8);
    expect(bigger.has(2, 1)).toBe(true);
    expect(bigger.has(9, 4)).toBe(true);
    expect(bigger.count()).toBe(2);

    const smaller = ExploredGrid.decode(grid.encode(), 5, 5);
    expect(smaller.has(2, 1)).toBe(true);
    expect(smaller.count()).toBe(1);
  });

  it("gives an empty grid for a wrong save, not a crash", () => {
    const wrong: unknown[] = [
      undefined,
      null,
      "text",
      {},
      { cols: 10, rows: 5 },
      { cols: 10, rows: 5, bits: 4 },
      { cols: 10, rows: 5, bits: "%%% not base64" },
      { cols: 10, rows: 5, bits: "AA==" },
      { cols: -1, rows: 5, bits: "AAAAAAAAAAA=" },
      { cols: 1.5, rows: 5, bits: "AAAAAAAAAAA=" },
      { cols: 100000, rows: 100000, bits: "AAAA" },
    ];

    for (const data of wrong) {
      const grid = ExploredGrid.decode(data, 10, 5);

      expect(grid.count()).toBe(0);
      expect(grid.cols).toBe(10);
    }
  });
});
