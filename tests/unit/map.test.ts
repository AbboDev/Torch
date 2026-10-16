import { describe, expect, it, vi } from "vitest";
import mapSource from "../../assets/maps/chozodia.json?raw";
import { BACKGROUNDS } from "@/config/backgrounds";
import { MapObject, parseDoors } from "@/world/doors";
import { createMapObjectRegistry } from "@/world/mapObjectHandlers";
import { getRoomProperty } from "@/world/rooms";
import { parseTileSavePoints } from "@/world/savePoints";
import { getObjectClass } from "@/world/tiledObjects";

// A check of the data of the real map: a mistake in Tiled shows up here
const map = JSON.parse(mapSource);
const objects: MapObject[] = map.layers
  .filter((layer: { name: string }) => layer.name === "objects")
  .flatMap((layer: { objects: MapObject[] }) => layer.objects);

const rooms = objects.filter((object) => getObjectClass(object) === "room");

describe("the map chozodia", () => {
  it("has rooms with a size, and unique ids", () => {
    expect(rooms.length).toBeGreaterThan(0);

    for (const room of rooms) {
      expect(room.width, `room ${room.id}`).toBeGreaterThan(0);
      expect(room.height, `room ${room.id}`).toBeGreaterThan(0);
    }

    expect(new Set(rooms.map((room) => room.id)).size).toBe(rooms.length);
  });

  it("only uses backgrounds which exist", () => {
    for (const room of rooms) {
      const background = getRoomProperty(room, "background");

      if (background !== undefined) {
        expect(Object.keys(BACKGROUNDS), `room ${room.id}`).toContain(
          background
        );
      }
    }
  });

  it("has a save point on every pair of barrel tiles", () => {
    expect(parseTileSavePoints(map).map((point) => point.id)).toEqual([
      "save_31_18",
      "save_34_25",
    ]);
  });

  it("has exactly one spawn point", () => {
    expect(
      objects.filter((object) => object.name === "spawn_point")
    ).toHaveLength(1);
  });

  it("has doors which all work", () => {
    const warn = vi.fn();
    const doors = parseDoors(objects, warn);

    expect(warn).not.toHaveBeenCalled();
    expect(doors).toHaveLength(
      objects.filter((object) => getObjectClass(object) === "door").length
    );
  });

  it("has the requested slopes, including the submerged ones in room_bottom", () => {
    const slopes = map.layers.find(
      (layer: { name: string }) => layer.name === "slopes"
    ).data as number[];
    const liquids = map.layers.find(
      (layer: { name: string }) => layer.name === "liquids"
    ).data as number[];
    const horizontalFlip = 0x80000000;
    const gidMask = 0x1fffffff;
    const positions = slopes.flatMap((gid, index) =>
      gid
        ? [
            [
              index % map.width,
              Math.floor(index / map.width),
              gid & gidMask,
              !!(gid & horizontalFlip),
            ] as [number, number, number, boolean],
          ]
        : []
    );

    const diagonalGids = [29, 45, 234];
    const diagonals = positions.filter(([, , gid]) =>
      diagonalGids.includes(gid)
    );
    expect(diagonals).toEqual([
      [45, 12, 29, false],
      [54, 12, 45, false],
      [95, 15, 234, false],
      [85, 16, 234, false],
      [71, 17, 234, false],
      [70, 18, 234, false],
      [40, 26, 234, true],
      [50, 27, 234, true],
      [64, 28, 234, true],
      [65, 29, 234, true],
    ]);

    const slopeGids = new Set(positions.map(([, , gid]) => gid));
    const slopeTiles = map.tilesets[0].tiles.filter((tile: { id: number }) =>
      slopeGids.has(tile.id + 1)
    );
    expect(slopeTiles).toHaveLength(slopeGids.size);
    for (const tile of slopeTiles) {
      const properties = Object.fromEntries(
        tile.properties.map((property: { name: string; value: unknown }) => [
          property.name,
          property.value,
        ])
      );

      expect(properties).toMatchObject({
        slopeLeft: expect.any(Number),
        slopeRight: expect.any(Number),
      });
    }

    const flats = positions.filter(([, , gid]) => !diagonalGids.includes(gid));
    expect(flats.map(([x, y]) => [x, y])).toEqual([
      [44, 12],
      [55, 12],
      [46, 13],
      [53, 13],
      [96, 15],
      [86, 16],
      [94, 16],
      [72, 17],
      [84, 17],
      [69, 19],
      [39, 26],
      [41, 27],
      [49, 27],
      [51, 28],
      [63, 28],
      [66, 30],
    ]);

    const solidLayers = map.layers
      .filter((layer: { name: string }) =>
        ["collision", "platforms"].includes(layer.name)
      )
      .map((layer: { data: number[] }) => layer.data);

    for (const [x, y] of diagonals) {
      expect(
        solidLayers.every((layer: number[]) => layer[y * map.width + x] === 0)
      ).toBe(true);
    }

    for (const [x, y] of flats) {
      expect(
        solidLayers.some((layer: number[]) => layer[y * map.width + x] !== 0)
      ).toBe(true);
    }

    const roomBottom = rooms.find((room) => room.name === "room_bottom")!;
    const submerged = positions.filter(([x, y]) => {
      const pixelX = x * map.tilewidth;
      const pixelY = y * map.tileheight;
      const insideRoom =
        pixelX >= roomBottom.x! &&
        pixelX < roomBottom.x! + roomBottom.width! &&
        pixelY >= roomBottom.y! &&
        pixelY < roomBottom.y! + roomBottom.height!;

      return insideRoom && liquids[y * map.width + x] !== 0;
    });

    expect(submerged.map(([x, y]) => [x, y])).toEqual([
      [39, 26],
      [40, 26],
      [41, 27],
      [49, 27],
      [50, 27],
      [51, 28],
      [63, 28],
      [64, 28],
      [65, 29],
      [66, 30],
    ]);
  });
});

describe("the objects of the map chozodia, made as the game makes them", () => {
  const layerObjects = (name: string): MapObject[] =>
    map.layers
      .filter((layer: { name: string }) => layer.name === name)
      .flatMap((layer: { objects: MapObject[] }) => layer.objects);

  it("makes every object, with nothing to say", () => {
    const registry = createMapObjectRegistry();
    const warn = vi.fn();
    const made = { room: 0, spawn: 0, savePoint: 0, door: 0, platform: 0 };

    const context = {
      addRoom: () => made.room++,
      addSavePoint: () => made.savePoint++,
      setSpawnPoint: () => made.spawn++,
      addDoor: () => made.door++,
      addPlatform: () => made.platform++,
    };

    for (const layer of ["objects", "scenario_elements"]) {
      const objects = layerObjects(layer);
      const report = registry.spawn(layer, objects, context, warn);

      expect(report.skipped, layer).toEqual([]);
      expect(report.created, layer).toBe(objects.length);
    }

    expect(warn).not.toHaveBeenCalled();
    expect(made.spawn).toBe(1);
    expect(made.room).toBe(rooms.length);
    expect(made.platform).toBe(layerObjects("scenario_elements").length);
  });
});
