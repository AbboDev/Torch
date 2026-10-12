import { describe, expect, it, vi } from "vitest";
import { TileCollisionQuery, collidesWithTile } from "@/world/oneWayTiles";

const query = (
  change: Partial<TileCollisionQuery> = {}
): TileCollisionQuery => ({
  layer: "collision",
  index: 5,
  tileTop: 100,
  feetBottom: () => 90,
  isDownPressed: () => false,
  hasTileAbove: () => false,
  ...change,
});

describe("collidesWithTile", () => {
  it("collides with any tile of the other layers, which has a tile", () => {
    expect(collidesWithTile(query())).toBe(true);
    expect(collidesWithTile(query({ index: 0 }))).toBe(true);
    expect(collidesWithTile(query({ index: -1 }))).toBe(false);
  });

  describe("platforms", () => {
    it("are solid for a Player above them", () => {
      expect(
        collidesWithTile(query({ layer: "platforms", feetBottom: () => 100 }))
      ).toBe(true);
    });

    it("can be jumped through from below, or from the inside", () => {
      expect(
        collidesWithTile(query({ layer: "platforms", feetBottom: () => 101 }))
      ).toBe(false);
      expect(
        collidesWithTile(query({ layer: "platforms", feetBottom: () => 130 }))
      ).toBe(false);
    });

    it("are not there without a tile", () => {
      expect(collidesWithTile(query({ layer: "platforms", index: -1 }))).toBe(
        false
      );
    });
  });

  describe("stairs", () => {
    const stairs = { layer: "stairs" };

    it("are solid on top, for a Player above them", () => {
      expect(collidesWithTile(query(stairs))).toBe(true);
    });

    it("can be dropped through with the down button", () => {
      expect(
        collidesWithTile(query({ ...stairs, isDownPressed: () => true }))
      ).toBe(false);
    });

    it("are not solid for a Player below the top", () => {
      expect(
        collidesWithTile(query({ ...stairs, feetBottom: () => 110 }))
      ).toBe(false);
    });

    it("are not solid when there is a tile above: only the top of a stair is", () => {
      expect(
        collidesWithTile(query({ ...stairs, hasTileAbove: () => true }))
      ).toBe(false);
    });

    it("looks at the rest only when it has to", () => {
      const feetBottom = vi.fn(() => 90);
      const hasTileAbove = vi.fn(() => false);
      const isDownPressed = vi.fn(() => false);

      collidesWithTile(
        query({ ...stairs, index: -1, feetBottom, hasTileAbove, isDownPressed })
      );
      expect(feetBottom).not.toHaveBeenCalled();

      collidesWithTile(
        query({ ...stairs, feetBottom: () => 200, hasTileAbove, isDownPressed })
      );
      expect(hasTileAbove).not.toHaveBeenCalled();
      expect(isDownPressed).not.toHaveBeenCalled();
    });
  });
});
