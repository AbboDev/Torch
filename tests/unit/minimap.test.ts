import { describe, expect, it, vi } from "vitest";
import { Terrain, buildMinimapMap } from "@/world/minimap";
import type { MapObject } from "@/world/doors";

/** A map of 6 x 4 tiles of 16 pixels, with the layers as lists of "col,row" */
function build(
  layers: Record<string, string[]> = {},
  rooms = [{ x: 0, y: 0, width: 96, height: 64 }],
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

const at = (cells: Uint8Array, col: number, row: number) => cells[row * 6 + col];

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
    expect(at(map.inRoom, 0, 0)).toBe(0);
    expect(at(map.inRoom, 1, 0)).toBe(1);
    expect(at(map.inRoom, 3, 1)).toBe(1);
    expect(at(map.inRoom, 4, 0)).toBe(0);
    expect(at(map.inRoom, 1, 2)).toBe(0);
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
    expect(at(map.inRoom, 3, 3)).toBe(1);
  });

  it("does not go out of the map", () => {
    const map = build({}, [{ x: -32, y: -32, width: 400, height: 400 }]);

    expect(map.inRoom.every((cell) => cell === 1)).toBe(true);
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
