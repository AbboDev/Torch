import { describe, expect, it, vi } from "vitest";
import { TileCollisionQuery, collidesWithTile } from "@/world/oneWayTiles";

const query = (
  change: Partial<TileCollisionQuery> = {}
): TileCollisionQuery => ({
  layer: "collision",
  index: 5,
  tileTop: 100,
  tileBottom: 110,
  tileLeft: 0,
  tileRight: 16,
  feetBottom: () => 90,
  headTop: () => 80,
  approachingFrom: () => "left",
  oneWayDirection: () => null,
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

  describe("one-way tiles (the `oneWayDirection` property)", () => {
    it("is solid for a Player pressing on the blocking face of a 'left' tile", () => {
      // Coming from the left: the Player presses the right face
      expect(
        collidesWithTile(
          query({ oneWayDirection: () => "left", approachingFrom: () => "left" })
        )
      ).toBe(true);
    });

    it("lets a Player pass through a 'left' tile from the other side", () => {
      // Coming from the right: the Player presses the left face
      expect(
        collidesWithTile(
          query({
            oneWayDirection: () => "left",
            approachingFrom: () => "right",
          })
        )
      ).toBe(false);
    });

    it("is solid for a Player pressing on the blocking face of a 'right' tile", () => {
      // Coming from the right: the Player presses the left face
      expect(
        collidesWithTile(
          query({
            oneWayDirection: () => "right",
            approachingFrom: () => "right",
          })
        )
      ).toBe(true);
    });

    it("lets a Player pass through a 'right' tile from the other side", () => {
      // Coming from the left: the Player presses the right face
      expect(
        collidesWithTile(
          query({
            oneWayDirection: () => "right",
            approachingFrom: () => "left",
          })
        )
      ).toBe(false);
    });

    it("behaves like a platform when the direction is 'up'", () => {
      expect(
        collidesWithTile(
          query({
            oneWayDirection: () => "up",
            feetBottom: () => 100,
          })
        )
      ).toBe(true);
      expect(
        collidesWithTile(
          query({
            oneWayDirection: () => "up",
            feetBottom: () => 101,
          })
        )
      ).toBe(false);
    });

    it("behaves like a ceiling when the direction is 'down'", () => {
      // Head above the bottom: the Player is inside the tile, blocked
      expect(
        collidesWithTile(
          query({
            oneWayDirection: () => "down",
            headTop: () => 109,
            tileBottom: 110,
          })
        )
      ).toBe(true);
      // Head below the bottom: the Player is below the tile, passes through
      expect(
        collidesWithTile(
          query({
            oneWayDirection: () => "down",
            headTop: () => 111,
            tileBottom: 110,
          })
        )
      ).toBe(false);
    });

    it("is solid like any other tile when there is no one-way property", () => {
      expect(
        collidesWithTile(query({ oneWayDirection: () => null }))
      ).toBe(true);
    });

    it("is not there without a tile, whatever the direction", () => {
      expect(
        collidesWithTile(
          query({ index: -1, oneWayDirection: () => "left" })
        )
      ).toBe(false);
      expect(
        collidesWithTile(
          query({ index: -1, oneWayDirection: () => "right" })
        )
      ).toBe(false);
    });

    it("does not ask the direction when the layer is platforms or stairs", () => {
      const oneWayDirection = vi.fn(() => "left");

      collidesWithTile(query({ layer: "platforms", oneWayDirection }));
      expect(oneWayDirection).not.toHaveBeenCalled();

      collidesWithTile(query({ layer: "stairs", oneWayDirection }));
      expect(oneWayDirection).not.toHaveBeenCalled();
    });

    it("does not ask the horizontal position when the direction is up/down", () => {
      const approachingFrom = vi.fn(() => "left");

      collidesWithTile(
        query({ oneWayDirection: () => "up", approachingFrom })
      );
      expect(approachingFrom).not.toHaveBeenCalled();

      collidesWithTile(
        query({ oneWayDirection: () => "down", approachingFrom })
      );
      expect(approachingFrom).not.toHaveBeenCalled();
    });
  });
});
