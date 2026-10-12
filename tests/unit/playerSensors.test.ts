import { describe, expect, it, vi } from "vitest";
import type { MapScene } from "@/scenes/MapScene";
import {
  PlayerSensors,
  PlayerSensorsConfig,
} from "@/entities/player/PlayerSensors";
import { DirectionAxisX } from "@/miscellaneous/Direction";

vi.mock("phaser", () => ({
  Geom: {
    Rectangle: class Rectangle {
      public constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
      ) {}
    },
  },
}));

const SIZE = 16;

interface FakeTile {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  pixelY: number;
}

/** A tile layer built from rows of text: "#" is a tile, "." is empty */
function fakeLayer(name: string, rows: string[]) {
  const tiles = new Map<string, FakeTile>();
  rows.forEach((row, y) =>
    [...row].forEach((cell, x) => {
      if (cell === "#") {
        tiles.set(`${x},${y}`, {
          x,
          y,
          width: SIZE,
          height: SIZE,
          index: 1,
          pixelY: y * SIZE,
        });
      }
    })
  );

  const within = (wx: number, wy: number, w: number, h: number) =>
    [...tiles.values()].filter(
      (tile) =>
        tile.x * SIZE <= wx + w &&
        (tile.x + 1) * SIZE >= wx &&
        tile.y * SIZE <= wy + h &&
        (tile.y + 1) * SIZE >= wy
    );

  return {
    tiles,
    scaleX: 1,
    scaleY: 1,
    layer: { name, tileWidth: SIZE, tileHeight: SIZE },
    getTilesWithinWorldXY: within,
    tileToWorldXY: (x: number, y: number) => ({ x: x * SIZE, y: y * SIZE }),
  };
}

type Layer = ReturnType<typeof fakeLayer>;

function setup(
  layers: { world: Layer[]; stairs?: Layer },
  platforms: { x: number; y: number; width: number; height: number }[] = []
) {
  const scene = {
    worldLayer: layers.world,
    stairsLayer: layers.stairs ?? fakeLayer("stairs", []),
    cameras: { main: {} },
    platforms: {
      getChildren: () =>
        platforms.map((body) => ({ body: { enable: true, ...body } })),
    },
    map: {
      getTilesWithinShape: (
        shape: { x: number; y: number; width: number; height: number },
        _options: unknown,
        _camera: unknown,
        layer: Layer
      ) =>
        [...layer.tiles.values()].filter(
          (tile) =>
            tile.x * SIZE < shape.x + shape.width &&
            (tile.x + 1) * SIZE > shape.x &&
            tile.y * SIZE < shape.y + shape.height &&
            (tile.y + 1) * SIZE > shape.y
        ),
      getTileAt: (x: number, y: number, _nonNull: unknown, layer: Layer) =>
        layer.tiles.get(`${x},${y}`) ?? null,
    },
  } as unknown as MapScene;

  const body = { x: 0, y: 0, width: 16, height: 32, prev: { x: 0, y: 0 } };

  const build = (swept = false) =>
    new PlayerSensors(scene, body, {
      wallDistance: 4,
      wallHeight: 16,
      ladderWidth: 16,
      sweptLedgeDetection: swept,
    } as PlayerSensorsConfig);

  const place = (x: number, y: number, prev = { x, y }) => {
    body.x = x;
    body.y = y;
    body.prev = prev;
  };

  return { build, place };
}

describe("walls", () => {
  const world = fakeLayer("world", [
    "........",
    "........",
    "........",
    "........",
    "......##",
    "......##",
    "......##",
    "........",
  ]);

  it("detects a wall within the detection distance, on the right side only", () => {
    const { build, place } = setup({ world: [world] });
    const sensors = build();

    // body right edge at 94: the wall (x = 96) is 2 px away, within 4
    place(78, 64);

    expect(sensors.isTouchingWall(DirectionAxisX.RIGHT)).toBe(true);
    expect(sensors.isTouchingWall(DirectionAxisX.LEFT)).toBe(false);
  });

  it("does not detect a wall which is too far", () => {
    const { build, place } = setup({ world: [world] });

    // body right edge at 91: the wall is 5 px away
    place(75, 64);

    expect(build().isTouchingWall(DirectionAxisX.RIGHT)).toBe(false);
  });

  it("does not detect a wall above the sensor", () => {
    const { build, place } = setup({ world: [world] });

    // the wall starts at y = 64 and the sensor (height 16) ends above it
    place(78, 0);

    expect(build().isTouchingWall(DirectionAxisX.RIGHT)).toBe(false);
  });
});

describe("ledges", () => {
  // The tile at (5, 5) is the corner of a ledge: x 80..96, y 80..96
  const ledge = [
    "........",
    "........",
    "........",
    "........",
    "........",
    ".....#..",
  ];

  it("finds the tile to hang from with the hand on the right", () => {
    const world = fakeLayer("world", ledge);
    const { build, place } = setup({ world: [world] });

    // hand: x 82..86, y 81..85, inside the top half of the tile
    place(65, 80);

    expect(build().findLedge(DirectionAxisX.RIGHT)?.pixelY).toBe(80);
  });

  it("does not find it with the hand on the other side", () => {
    const world = fakeLayer("world", ledge);
    const { build, place } = setup({ world: [world] });

    place(65, 80);

    expect(build().findLedge(DirectionAxisX.LEFT)).toBeNull();
  });

  it("does not find it when the hand is below the top half", () => {
    const world = fakeLayer("world", ledge);
    const { build, place } = setup({ world: [world] });

    // hand y 85.5..89.5: crosses the middle of the tile
    place(65, 84.5);

    expect(build().findLedge(DirectionAxisX.RIGHT)).toBeNull();
  });

  it("does not find it when there is a tile on top of it", () => {
    const world = fakeLayer("world", [
      "........",
      "........",
      "........",
      "........",
      ".....#..",
      ".....#..",
    ]);
    const { build, place } = setup({ world: [world] });

    place(65, 80);

    expect(build().findLedge(DirectionAxisX.RIGHT)).toBeNull();
  });

  it("does not let the Player hang from stairs", () => {
    const stairs = fakeLayer("stairs", ledge);
    const { build, place } = setup({ world: [stairs] });

    place(65, 80);

    expect(build().findLedge(DirectionAxisX.RIGHT)).toBeNull();
  });

  describe("when the Player falls faster than the grab area is high", () => {
    const world = fakeLayer("world", ledge);

    // 20 px in a single frame: the hand was at y 71 and is now at y 91
    const fall = (
      place: (x: number, y: number, prev?: { x: number; y: number }) => void
    ) => place(65, 90, { x: 65, y: 70 });

    it("misses the ledge by default", () => {
      const { build, place } = setup({ world: [world] });
      fall(place);

      expect(build(false).findLedge(DirectionAxisX.RIGHT)).toBeNull();
    });

    it("grabs it with the swept detection", () => {
      const { build, place } = setup({ world: [world] });
      fall(place);

      expect(build(true).findLedge(DirectionAxisX.RIGHT)?.pixelY).toBe(80);
    });
  });
});

describe("ladders", () => {
  // A ladder tile at (4, 7): x 64..80, y 112..128, top half y 112..120
  const stairs = fakeLayer("stairs", [
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "....#...",
  ]);

  it("is true when the feet are in the top half of a ladder", () => {
    const { build, place } = setup({ world: [], stairs });

    // body bottom at 113: the feet strip is y 112..114
    place(64, 81);

    expect(build().isOnLadderTop()).toBe(true);
  });

  it("is false when the feet are in the bottom half", () => {
    const { build, place } = setup({ world: [], stairs });

    // body bottom at 121: the feet strip is y 120..122
    place(64, 89);

    expect(build().isOnLadderTop()).toBe(false);
  });
});

describe("platforms", () => {
  const platforms = [{ x: 64, y: 112, width: 48, height: 16 }];

  it("is true when standing on a platform", () => {
    const { build, place } = setup({ world: [] }, platforms);

    place(70, 80); // bottom at 112

    expect(build().isOnPlatform()).toBe(true);
  });

  it("is false when above it", () => {
    const { build, place } = setup({ world: [] }, platforms);

    place(70, 77); // bottom at 109

    expect(build().isOnPlatform()).toBe(false);
  });

  it("is false beside it", () => {
    const { build, place } = setup({ world: [] }, platforms);

    place(120, 80);

    expect(build().isOnPlatform()).toBe(false);
  });
});
