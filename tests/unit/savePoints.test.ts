import { describe, expect, it, vi } from "vitest";
import { MapObject } from "@/world/doors";
import {
  SavePointTrigger,
  findSavePoint,
  findSavePointAt,
  parseSavePoints,
  parseTileSavePoints,
} from "@/world/savePoints";

const save = (id: number, name: string | undefined, extra = {}): MapObject => ({
  id,
  type: "save_point",
  name,
  x: 100,
  y: 200,
  ...extra,
});

describe("parseSavePoints", () => {
  it("uses a rectangle as the area and restarts at its top center", () => {
    const [point] = parseSavePoints([
      save(1, "save_lab", { width: 32, height: 48 }),
    ]);

    expect(point).toEqual({
      id: "save_lab",
      x: 100,
      y: 200,
      width: 32,
      height: 48,
      spawn: { x: 116, y: 200 },
    });
  });

  it("makes an area around a point and restarts exactly on it", () => {
    const [point] = parseSavePoints([save(1, "save_lab")]);

    expect(point.spawn).toEqual({ x: 100, y: 200 });
    expect(point.x).toBeLessThan(100);
    expect(point.x + point.width).toBeGreaterThan(100);
    expect(point.y).toBeLessThan(200);
    expect(point.y + point.height).toBeGreaterThan(200);
  });

  it("ignores other objects", () => {
    const objects: MapObject[] = [
      { id: 1, type: "room", name: "a" },
      { id: 2, name: "spawn_point", x: 0, y: 0 },
    ];

    expect(parseSavePoints(objects)).toEqual([]);
  });

  it("leaves out, with a warning, a save point without a name", () => {
    const warn = vi.fn();

    expect(parseSavePoints([save(7, undefined), save(8, "")], warn)).toEqual(
      []
    );
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("keeps only the first of two save points with the same name", () => {
    const warn = vi.fn();
    const points = parseSavePoints(
      [save(1, "same", { x: 10 }), save(2, "same", { x: 500 })],
      warn
    );

    expect(points).toHaveLength(1);
    expect(points[0].spawn.x).toBe(10);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("finding save points", () => {
  const points = parseSavePoints([
    save(1, "a", { x: 0, y: 0, width: 32, height: 32 }),
    save(2, "b", { x: 100, y: 0, width: 32, height: 32 }),
  ]);

  it("finds one by its id", () => {
    expect(findSavePoint(points, "b")?.x).toBe(100);
    expect(findSavePoint(points, "missing")).toBeUndefined();
  });

  it("finds the one containing a point, left and top included", () => {
    expect(findSavePointAt(points, 0, 0)?.id).toBe("a");
    expect(findSavePointAt(points, 31, 31)?.id).toBe("a");
    expect(findSavePointAt(points, 32, 10)).toBeNull();
    expect(findSavePointAt(points, 110, 10)?.id).toBe("b");
  });
});

const barrels = (data: number[], width: number, firstgid = 1) => ({
  tilesets: [{ name: "chozodia", firstgid }],
  layers: [{ type: "tilelayer", width, data }],
});

describe("parseTileSavePoints", () => {
  it("makes a save point where the two barrel tiles are side by side", () => {
    const [point] = parseTileSavePoints(barrels([0, 0, 0, 0, 55, 71, 0, 0], 4));

    expect(point).toEqual({
      id: "save_0_1",
      x: 0,
      y: 0,
      width: 32,
      height: 32,
      spawn: { x: 16, y: -16 },
    });
  });

  it("accepts the barrels in either order, and a gid with a flip flag", () => {
    const flipped = 71 | 0x80000000;
    const points = parseTileSavePoints(barrels([flipped, 55], 2));

    expect(points).toHaveLength(1);
    expect(points[0].id).toBe("save_0_0");
  });

  it("does not join a pair split by the end of the row", () => {
    expect(parseTileSavePoints(barrels([0, 55, 71, 0], 2))).toEqual([]);
  });

  it("uses the firstgid of the chozodia tileset, and nothing if it is missing", () => {
    expect(parseTileSavePoints(barrels([64, 80], 2, 10))).toHaveLength(1);
    expect(parseTileSavePoints({ layers: [] })).toEqual([]);
    expect(
      parseTileSavePoints({
        tilesets: [{ name: "chozodia" }],
        layers: [{ type: "tilelayer", width: 2, data: [55, 71] }],
      })
    ).toEqual([]);
  });

  it("keeps one save point when the same pair is painted on two layers", () => {
    const map = barrels([55, 71], 2);

    map.layers.push({ type: "tilelayer", width: 2, data: [55, 71] });

    expect(parseTileSavePoints(map)).toHaveLength(1);
  });
});

describe("SavePointTrigger", () => {
  const [point] = parseSavePoints([save(1, "a", { width: 32, height: 32 })]);

  it("saves when Up is pressed inside the area", () => {
    const trigger = new SavePointTrigger();

    expect(trigger.update(point, false, true)).toBeNull();
    expect(trigger.update(point, true, true)).toBe(point);
  });

  it("saves once per press, not while Up is held", () => {
    const trigger = new SavePointTrigger();

    expect(trigger.update(point, true, true)).toBe(point);
    expect(trigger.update(point, true, true)).toBeNull();
    expect(trigger.update(point, false, true)).toBeNull();
    expect(trigger.update(point, true, true)).toBe(point);
  });

  it("does nothing if Up was already held when the Player came in", () => {
    const trigger = new SavePointTrigger();

    expect(trigger.update(null, true, true)).toBeNull();
    expect(trigger.update(point, true, true)).toBeNull();
  });

  it("does nothing outside the area or when the Player can not save", () => {
    const trigger = new SavePointTrigger();

    expect(trigger.update(null, false, true)).toBeNull();
    expect(trigger.update(null, true, true)).toBeNull();
    expect(trigger.update(point, false, false)).toBeNull();
    expect(trigger.update(point, true, false)).toBeNull();
  });
});
