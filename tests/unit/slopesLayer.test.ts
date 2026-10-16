import { describe, expect, it, vi } from "vitest";
import type * as Phaser from "phaser";
import {
  SLOPES_LAYER_NAME,
  buildSlopeGrid,
  createSlopes,
  renderSlopesDebug,
} from "@/world/slopesLayer";
import { SlopeGrid } from "@/world/slopeGeometry";

vi.mock("phaser", () => ({
  Physics: { Arcade: { Events: { WORLD_STEP: "worldstep" } } },
  Scenes: { Events: { SHUTDOWN: "shutdown" } },
  Math: {
    Vector2: class Vector2 {
      public constructor(
        public x: number,
        public y: number
      ) {}
    },
  },
}));

interface FakeTile {
  x: number;
  y: number;
  height: number;
  index: number;
  properties: Record<string, unknown>;
  flipX: boolean;
}

const tile = (
  x: number,
  y: number,
  properties: Record<string, unknown>,
  flipX = false
) => ({
  x,
  y,
  height: 16,
  index: 1,
  properties,
  flipX,
});

/** The part of a Phaser tile layer which buildSlopeGrid uses */
function fakeLayer(tiles: FakeTile[]) {
  return {
    x: 0,
    y: 0,
    layer: { tileWidth: 16, tileHeight: 16, width: 40, height: 30 },
    forEachTile: (callback: (tile: FakeTile) => void) =>
      tiles.forEach(callback),
  } as unknown as Phaser.Tilemaps.TilemapLayer;
}

describe("buildSlopeGrid", () => {
  it("takes the tiles which have the slope properties", () => {
    const grid = buildSlopeGrid(
      fakeLayer([
        tile(3, 9, { collides: true, slopeLeft: 0, slopeRight: 16 }),
        tile(4, 8, { collides: true, slopeLeft: 8, slopeRight: 12 }),
      ])
    );

    expect(grid.size).toBe(2);
    expect(grid.getSlope(3, 9)).toEqual({ left: 0, right: 16 });
    expect(grid.getSlope(4, 8)).toEqual({ left: 8, right: 12 });
    expect(grid.tileWidth).toBe(16);
  });

  it("reverses a slope when its tile is flipped horizontally", () => {
    const grid = buildSlopeGrid(
      fakeLayer([tile(3, 9, { slopeLeft: 0, slopeRight: 16 }, true)])
    );

    expect(grid.getSlope(3, 9)).toEqual({ left: 16, right: 0 });
  });

  it("leaves out the tiles which are only art, or have wrong properties", () => {
    const grid = buildSlopeGrid(
      fakeLayer([
        tile(1, 1, { collides: true }),
        tile(2, 1, { slopeLeft: "0", slopeRight: 16 }),
        tile(3, 1, { slopeLeft: 0 }),
        tile(4, 1, { slopeLeft: 0, slopeRight: 16 }),
      ])
    );

    expect(grid.size).toBe(1);
    expect(grid.getSlope(4, 1)).not.toBeNull();
  });

  it("keeps the heights inside the tile", () => {
    const grid = buildSlopeGrid(
      fakeLayer([tile(1, 1, { slopeLeft: -3, slopeRight: 99 })])
    );

    expect(grid.getSlope(1, 1)).toEqual({ left: 0, right: 16 });
  });
});

describe("createSlopes", () => {
  function setup() {
    const worldListeners = new Map<string, (delta: number) => void>();
    const sceneListeners = new Map<string, () => void>();

    const scene = {
      physics: {
        world: {
          on: (event: string, listener: (delta: number) => void) =>
            worldListeners.set(event, listener),
          off: (event: string) => worldListeners.delete(event),
        },
      },
      events: {
        once: (event: string, listener: () => void) =>
          sceneListeners.set(event, listener),
      },
    } as unknown as Phaser.Scene;

    return { scene, worldListeners, sceneListeners };
  }

  it("steps the slopes after every step of the physics", () => {
    const { scene, worldListeners } = setup();
    const layer = fakeLayer([tile(10, 9, { slopeLeft: 0, slopeRight: 16 })]);

    const slopes = createSlopes(scene, layer);
    const body = {
      enable: true,
      allowGravity: true,
      x: 160,
      y: 121,
      width: 16,
      height: 32,
      velocity: { x: 0, y: 0 },
      wasTouching: { down: true },
      touching: { down: false, none: true },
      blocked: { down: false, none: true },
      updateCenter: () => {},
    };
    slopes.track(body);

    worldListeners.get("worldstep")!(1 / 60);

    // The high side of the ramp tile, not its middle
    expect(body.y + body.height).toBeCloseTo(144.5, 6);
  });

  it("works for a map without slopes", () => {
    const { scene } = setup();

    const slopes = createSlopes(scene, null);

    expect(slopes.isEmpty).toBe(true);
  });

  it("stops listening to the physics when the scene shuts down", () => {
    const { scene, worldListeners, sceneListeners } = setup();

    createSlopes(scene, null);
    expect(worldListeners.has("worldstep")).toBe(true);

    sceneListeners.get("shutdown")!();

    expect(worldListeners.has("worldstep")).toBe(false);
  });

  it("stops listening when destroyed, and a new one can take its place", () => {
    const { scene, worldListeners } = setup();

    const first = createSlopes(scene, null);
    first.destroy();
    expect(worldListeners.has("worldstep")).toBe(false);

    createSlopes(scene, null);
    expect(worldListeners.has("worldstep")).toBe(true);
  });
});

describe("renderSlopesDebug", () => {
  it("draws the shape of every slope tile", () => {
    const grid = new SlopeGrid(16, 16);
    grid.set(10, 9, { left: 0, right: 16 });
    const fillPoints = vi.fn();
    const graphics = {
      fillStyle: vi.fn(),
      lineStyle: vi.fn(),
      fillPoints,
    } as unknown as Phaser.GameObjects.Graphics;

    renderSlopesDebug(graphics, grid);

    const points = fillPoints.mock.calls[0][0] as { x: number; y: number }[];
    // the bottom left, the ground at the left edge, at the right edge, the bottom right
    expect(points.map(({ x, y }) => [x, y])).toEqual([
      [160, 160],
      [160, 160],
      [176, 144],
      [176, 160],
    ]);
  });
});

describe("the layer name", () => {
  it("is the one to use in Tiled", () => {
    expect(SLOPES_LAYER_NAME).toBe("slopes");
  });
});
