import { describe, expect, it, vi } from "vitest";
import {
  Hazard,
  Terrain,
  buildMinimapMap,
  getRoomFlags,
} from "@/world/minimap";
import { Darkness } from "@/world/darkness";
import type { MapObject } from "@/world/doors";

/** A map of 6 x 4 tiles of 16 pixels, with the layers as lists of "col,row" */
function build(
  layers: Record<string, string[]> = {},
  rooms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    properties?: Array<{ name: string; value: unknown }>;
  }> = [{ x: 0, y: 0, width: 96, height: 64 }],
  objects: MapObject[] = []
) {
  return buildMinimapMap({
    cols: 6,
    rows: 4,
    tileSize: 16,
    isFilled: (layer, col, row) => layers[layer]?.includes(`${col},${row}`) ?? false,
    rooms,
    objects,
  });
}

const at = (cells: ArrayLike<number>, col: number, row: number) =>
  cells[row * 6 + col];

describe("buildMinimapMap: terrain", () => {
  it("takes the terrain from the tile layers", () => {
    const map = build({
      collision: ["0,0"],
      breakables: ["1,0"],
      platforms: ["2,0"],
      stairs: ["3,0"],
      liquids: ["4,0"],
    });

    expect(at(map.terrain, 0, 0)).toBe(Terrain.SOLID);
    expect(at(map.terrain, 1, 0)).toBe(Terrain.SOLID);
    expect(at(map.terrain, 2, 0)).toBe(Terrain.PLATFORM);
    expect(at(map.terrain, 3, 0)).toBe(Terrain.PLATFORM);
    expect(at(map.terrain, 4, 0)).toBe(Terrain.LIQUID);
    expect(at(map.terrain, 5, 0)).toBe(Terrain.EMPTY);
  });

  it("makes a wall of what is both a wall and in the water", () => {
    const map = build({ collision: ["1,1"], liquids: ["1,1", "2,1"] });

    expect(at(map.terrain, 1, 1)).toBe(Terrain.SOLID);
    expect(at(map.terrain, 2, 1)).toBe(Terrain.LIQUID);
  });
});

describe("buildMinimapMap: rooms", () => {
  it("draws only inside the rooms, whatever the pixels of the rooms are", () => {
    const map = build({}, [{ x: 16, y: 0, width: 40, height: 32 }]);

    // x from 16 to 56 is the columns 1, 2 and 3 (the last one only in part)
    expect(at(map.roomOf, 0, 0)).toBe(-1);
    expect(at(map.roomOf, 1, 0)).toBe(0);
    expect(at(map.roomOf, 3, 1)).toBe(0);
    expect(at(map.roomOf, 4, 0)).toBe(-1);
    expect(at(map.roomOf, 1, 2)).toBe(-1);
  });

  it("marks the border of every room, also where two rooms touch", () => {
    const map = build({}, [
      { x: 0, y: 0, width: 96, height: 32 },
      { x: 0, y: 32, width: 96, height: 32 },
    ]);

    expect(at(map.edge, 0, 0)).toBe(1);
    expect(at(map.edge, 3, 0)).toBe(1);
    expect(at(map.edge, 3, 1)).toBe(1);
    expect(at(map.edge, 3, 2)).toBe(1);
    expect(at(map.roomOf, 3, 3)).toBe(1);
  });

  it("does not go out of the map", () => {
    const map = build({}, [{ x: -32, y: -32, width: 400, height: 400 }]);

    expect(map.roomOf.every((room) => room === 0)).toBe(true);
  });
});

describe("buildMinimapMap: points of interest", () => {
  it("takes the save points and the doors, in the middle of the object", () => {
    const map = build({}, undefined, [
      { id: 7, type: "save_point", name: "s", x: 32, y: 16, width: 16, height: 16 },
      { id: 8, type: "door", x: 0, y: 0, width: 32, height: 32 },
      { id: 9, type: "room", x: 0, y: 0, width: 96, height: 64 },
      { id: 1, name: "spawn_point", x: 0, y: 0, width: 0, height: 0 },
    ]);

    expect(map.pois).toEqual([
      { id: "save_point_7", kind: "save", col: 2, row: 1 },
      { id: "door_8", kind: "door", col: 1, row: 1 },
    ]);
  });

  it("takes the objects of type poi, with their kind", () => {
    const map = build({}, undefined, [
      {
        id: 3,
        type: "poi",
        x: 80,
        y: 48,
        properties: [{ name: "kind", value: "boss" }],
      },
      { id: 4, type: "poi", x: 0, y: 0 },
    ]);

    expect(map.pois.map((poi) => [poi.id, poi.kind, poi.col, poi.row])).toEqual([
      ["poi_3", "boss", 5, 3],
      ["poi_4", "other", 0, 0],
    ]);
  });

  it("is not fooled by a wrong kind or a place outside the map", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const map = build({}, undefined, [
      { id: 5, type: "poi", x: 0, y: 0, properties: [{ name: "kind", value: "x" }] },
      { id: 6, type: "poi", x: 5000, y: 0 },
    ]);

    expect(map.pois).toEqual([{ id: "poi_5", kind: "other", col: 0, row: 0 }]);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

describe("buildMinimapMap: the room of every cell", () => {
  it("tells the room of every cell, and -1 outside the rooms", () => {
    const map = build({}, [
      { x: 0, y: 0, width: 48, height: 64 },
      { x: 48, y: 0, width: 48, height: 32 },
    ]);

    expect(Array.from(map.roomOf.slice(0, 6))).toEqual([0, 0, 0, 1, 1, 1]);
    // the second room is only half as tall
    expect(map.roomOf[3 * 6 + 4]).toBe(-1);
    expect(map.roomOf[3 * 6 + 1]).toBe(0);
  });

  it("gives a cell the first room which has it", () => {
    const map = build({}, [
      { x: 0, y: 0, width: 64, height: 64 },
      { x: 32, y: 0, width: 64, height: 64 },
    ]);

    // the columns 2 and 3 are in both rooms: the first one has them
    expect(map.roomOf[2]).toBe(0);
    expect(map.roomOf[3]).toBe(0);
    expect(map.roomOf[4]).toBe(1);
  });

  it("keeps the flags of every room, in the order of the rooms", () => {
    const map = build({}, [
      { x: 0, y: 0, width: 48, height: 64 },
      {
        x: 48,
        y: 0,
        width: 48,
        height: 64,
        properties: [{ name: "hot", value: true }],
      },
    ]);

    expect(map.rooms).toEqual([
      { darkness: Darkness.NONE, hazard: Hazard.NONE },
      { darkness: Darkness.NONE, hazard: Hazard.HOT },
    ]);
  });
});

describe("getRoomFlags", () => {
  const flags = (...properties: Array<[string, unknown]>) =>
    getRoomFlags({
      id: 1,
      properties: properties.map(([name, value]) => ({ name, value })),
    });

  it("reads the darkness: a color is dark, as the game does, and the name tells the level", () => {
    expect(flags(["dark", "000000"]).darkness).toBe(Darkness.DARK);
    expect(flags(["dark", ""]).darkness).toBe(Darkness.NONE);
    expect(flags(["dark", true]).darkness).toBe(Darkness.NONE);
    expect(flags().darkness).toBe(Darkness.NONE);
    expect(
      flags(["dark", "808080"], ["darkness", "shaded"]).darkness
    ).toBe(Darkness.SHADED);
    expect(
      flags(["dark", "301040"], ["darkness", "corrupted_total"]).darkness
    ).toBe(Darkness.CORRUPTED_TOTAL);
  });

  it("reads hot and toxic", () => {
    expect(flags(["hot", true]).hazard).toBe(Hazard.HOT);
    expect(flags(["toxic", true]).hazard).toBe(Hazard.TOXIC);
    expect(flags(["hot", false], ["toxic", false]).hazard).toBe(Hazard.NONE);
  });

  it("lets either be together with dark", () => {
    expect(flags(["dark", "101010"], ["hot", true])).toEqual({
      darkness: Darkness.DARK,
      hazard: Hazard.HOT,
    });
    expect(flags(["dark", "101010"], ["toxic", true])).toEqual({
      darkness: Darkness.DARK,
      hazard: Hazard.TOXIC,
    });
  });

  it("does not take hot and toxic together: it is hot, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(flags(["toxic", true], ["hot", true]).hazard).toBe(Hazard.HOT);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("takes only a real true: a text is not", () => {
    expect(flags(["hot", "true"]).hazard).toBe(Hazard.NONE);
  });
});
