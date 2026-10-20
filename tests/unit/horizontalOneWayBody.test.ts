import { describe, expect, it, vi } from "vitest";

vi.mock("phaser", () => ({}));

import { DirectionAxisX } from "@/miscellaneous/Direction";
import {
  getApproachingSide,
  readOneWayDirection,
  updateHorizontalOneWayFlags,
} from "@/world/horizontalOneWayBody";

describe("horizontalOneWayBody", () => {
  describe("readOneWayDirection", () => {
    it("reads valid directions", () => {
      expect(readOneWayDirection({ oneWayDirection: "up" })).toBe("up");
      expect(readOneWayDirection({ oneWayDirection: "down" })).toBe("down");
      expect(readOneWayDirection({ oneWayDirection: "left" })).toBe("left");
      expect(readOneWayDirection({ oneWayDirection: "right" })).toBe("right");
    });

    it("returns null for invalid or missing directions", () => {
      expect(readOneWayDirection(undefined)).toBeNull();
      expect(readOneWayDirection({})).toBeNull();
      expect(readOneWayDirection({ oneWayDirection: "diagonal" })).toBeNull();
      expect(readOneWayDirection({ oneWayDirection: 42 })).toBeNull();
    });
  });

  describe("getApproachingSide", () => {
    it("returns 'left' when body center is left of tile center", () => {
      expect(getApproachingSide(10, 20)).toBe("left");
    });

    it("returns 'right' when body center is right of or at tile center", () => {
      expect(getApproachingSide(30, 20)).toBe("right");
      expect(getApproachingSide(20, 20)).toBe("right");
    });
  });

  describe("updateHorizontalOneWayFlags", () => {
    const createBody = (vy = 0) => ({
      velocity: { x: 0, y: vy },
      blocked: { none: vi.fn() },
      checkCollision: { left: true, right: true },
    });

    it("leaves collisions enabled when falling or stationary", () => {
      const body = createBody(50);
      updateHorizontalOneWayFlags(body, DirectionAxisX.LEFT, false);
      expect(body.checkCollision.left).toBe(true);
      expect(body.checkCollision.right).toBe(true);
      expect(body.blocked.none).toHaveBeenCalled();
    });

    it("leaves collisions enabled when standing on floor", () => {
      const body = createBody(-50);
      updateHorizontalOneWayFlags(body, DirectionAxisX.LEFT, true);
      expect(body.checkCollision.left).toBe(true);
      expect(body.checkCollision.right).toBe(true);
    });

    it("disables left collision when moving up and facing left", () => {
      const body = createBody(-50);
      updateHorizontalOneWayFlags(body, DirectionAxisX.LEFT, false);
      expect(body.checkCollision.left).toBe(false);
      expect(body.checkCollision.right).toBe(true);
    });

    it("disables right collision when moving up and facing right", () => {
      const body = createBody(-50);
      updateHorizontalOneWayFlags(body, DirectionAxisX.RIGHT, false);
      expect(body.checkCollision.left).toBe(true);
      expect(body.checkCollision.right).toBe(false);
    });
  });
});
