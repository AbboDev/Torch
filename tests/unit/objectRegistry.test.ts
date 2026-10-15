import { describe, expect, it, vi } from "vitest";
import { ObjectRegistry, resolveClass } from "@/world/objectRegistry";
import { ObjectSchema } from "@/world/objectSchemas";
import { MapObject } from "@/world/doors";
import {
  MapObjectContext,
  createMapObjectRegistry,
} from "@/world/mapObjectHandlers";

const enemy: ObjectSchema = {
  class: "enemy",
  layer: "objects",
  color: "#ff0000",
  description: "An enemy",
  properties: {
    life: { type: "int", default: 3, min: 1, description: "Its life" },
    boss: { type: "bool", required: true, description: "A boss" },
  },
};

const object = (id: number, change: Partial<MapObject> = {}): MapObject => ({
  id,
  type: "enemy",
  x: 10 * id,
  y: 20,
  properties: [{ name: "boss", value: false }],
  ...change,
});

function setup() {
  const created: [number, Record<string, unknown>][] = [];
  const registry = new ObjectRegistry<string[], MapObject>().register({
    schema: enemy,
    create: (item, values, _context, layer) => {
      created.push([item.id, { ...values, layerSize: layer.length }]);
    },
  });
  const warn = vi.fn();

  return { registry, created, warn };
}

describe("ObjectRegistry", () => {
  it("makes the objects of a known class, with their properties and the layer", () => {
    const { registry, created, warn } = setup();

    const report = registry.spawn(
      "objects",
      [
        object(1),
        object(2, {
          properties: [
            { name: "boss", value: true },
            { name: "life", value: 9 },
          ],
        }),
      ],
      [],
      warn
    );

    expect(report).toEqual({ created: 2, skipped: [], warnings: [] });
    expect(created).toEqual([
      [1, { life: 3, boss: false, layerSize: 2 }],
      [2, { life: 9, boss: true, layerSize: 2 }],
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it("takes the class from the type of an older Tiled", () => {
    const { registry, created } = setup();

    registry.spawn(
      "objects",
      [object(1, { type: undefined, class: "enemy" })],
      []
    );

    expect(created).toHaveLength(1);
  });

  it("tells about a class it does not know, once", () => {
    const { registry, created, warn } = setup();

    const report = registry.spawn(
      "objects",
      [object(1, { type: "ghost" }), object(2, { type: "ghost" }), object(3)],
      [],
      warn
    );

    expect(created).toHaveLength(1);
    expect(report.skipped.map((skipped) => skipped.id)).toEqual([1, 2]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"ghost"');
  });

  it("leaves out an object with no class", () => {
    const { registry, warn } = setup();

    const report = registry.spawn(
      "objects",
      [object(1, { type: "" })],
      [],
      warn
    );

    expect(report.skipped[0].reason).toBe("has no class");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("leaves out an object in the wrong layer", () => {
    const { registry, created, warn } = setup();

    registry.spawn("scenario_elements", [object(1)], [], warn);

    expect(created).toEqual([]);
    expect(warn.mock.calls[0][0]).toContain('goes in the layer "objects"');
  });

  it("leaves out an object which needs a name and has none", () => {
    const registry = new ObjectRegistry<string[], MapObject>().register({
      schema: { ...enemy, requiresName: true },
      create: vi.fn(),
    });
    const warn = vi.fn();

    const report = registry.spawn(
      "objects",
      [object(1), object(2, { name: "boss_1" })],
      [],
      warn
    );

    expect(report.created).toBe(1);
    expect(report.skipped).toEqual([
      { id: 1, reason: "is a enemy and needs a name" },
    ]);
  });

  it("leaves out an object with a wrong required property, and tells what", () => {
    const { registry, created, warn } = setup();

    const report = registry.spawn(
      "objects",
      [object(1, { properties: [] })],
      [],
      warn
    );

    expect(created).toEqual([]);
    expect(report.skipped[0].reason).toContain(
      'missing the required property "boss"'
    );
  });

  it("tells about the other wrong properties and makes the object anyway", () => {
    const { registry, created, warn } = setup();

    registry.spawn(
      "objects",
      [
        object(1, {
          properties: [
            { name: "boss", value: false },
            { name: "lifee", value: 4 },
          ],
        }),
      ],
      [],
      warn
    );

    expect(created).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith('enemy 1: unknown property "lifee"');
  });

  it("goes on with the others when one object is wrong", () => {
    const { registry, created } = setup();

    registry.spawn(
      "objects",
      [
        object(1, { properties: [] }),
        object(2),
        object(3, { type: "ghost" }),
        object(4),
      ],
      [],
      vi.fn()
    );

    expect(created.map(([id]) => id)).toEqual([2, 4]);
  });

  it("leaves out an object when its handler says it can not be made", () => {
    const registry = new ObjectRegistry<string[], MapObject>().register({
      schema: enemy,
      create: (item) => (item.id === 1 ? "has no room to stand" : undefined),
    });
    const warn = vi.fn();

    const report = registry.spawn("objects", [object(1), object(2)], [], warn);

    expect(report.created).toBe(1);
    expect(report.skipped).toEqual([{ id: 1, reason: "has no room to stand" }]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("does not take two handlers for a class", () => {
    const { registry } = setup();

    expect(() => registry.register({ schema: enemy, create: vi.fn() })).toThrow(
      /already a handler/
    );
  });

  it("knows its classes", () => {
    const { registry } = setup();

    expect(registry.has("enemy")).toBe(true);
    expect(registry.has("ghost")).toBe(false);
    expect(registry.getClasses()).toEqual(["enemy"]);
  });
});

describe("resolveClass", () => {
  it("is the class, or the type", () => {
    expect(resolveClass({ id: 1, class: "door" })).toBe("door");
    expect(resolveClass({ id: 1, type: "door" })).toBe("door");
  });

  it("makes a spawn point of an object with that name and no class, like the old maps", () => {
    expect(resolveClass({ id: 1, name: "spawn_point" })).toBe("spawn_point");
    expect(resolveClass({ id: 1, name: "spawn_point", type: "" })).toBe(
      "spawn_point"
    );
    expect(resolveClass({ id: 1, name: "other" })).toBe("");
  });
});

describe("the objects of the map of the game", () => {
  function recordingContext() {
    const calls: [string, number][] = [];
    const context: MapObjectContext = {
      addRoom: (room) => calls.push(["room", room.id]),
      addSavePoint: (point) => calls.push(["savePoint", point.id]),
      setSpawnPoint: (point) => calls.push(["spawn", point.id]),
      addDoor: (door) => calls.push(["door", door.id]),
      addPlatform: (platform) => calls.push(["platform", platform.id]),
    };

    return { context, calls };
  }

  const registry = createMapObjectRegistry();

  it("goes to the right place of the scene", () => {
    const { context, calls } = recordingContext();

    registry.spawn(
      "objects",
      [
        { id: 1, type: "room", x: 0, y: 0, width: 320, height: 176 },
        { id: 2, name: "spawn_point", x: 16, y: 16 },
        { id: 3, type: "save_point", name: "lab", x: 50, y: 50 },
        { id: 4, type: "room", x: 320, y: 0, width: 320, height: 176 },
      ],
      context
    );

    expect(calls).toEqual([
      ["room", 1],
      ["spawn", 2],
      ["savePoint", 3],
      ["room", 4],
    ]);
  });

  it("makes a door from the objects of its layer, and ignores one which can not work", () => {
    const { context, calls } = recordingContext();
    const warn = vi.fn();

    registry.spawn(
      "objects",
      [
        { id: 10, name: "exit", x: 640, y: 320 },
        {
          id: 11,
          type: "door",
          x: 0,
          y: 0,
          width: 16,
          height: 32,
          properties: [{ name: "target", value: 10 }],
        },
        {
          id: 12,
          type: "door",
          x: 0,
          y: 0,
          width: 16,
          height: 32,
          properties: [{ name: "target", value: 99 }],
        },
      ].map((item) => ({ ...item })),
      context,
      warn
    );

    // the one without a class is left out too: only the doors are objects here
    expect(calls).toEqual([["door", 11]]);
    expect(warn).toHaveBeenCalled();
  });

  it("makes the platforms of the layer scenario_elements only", () => {
    const { context, calls } = recordingContext();
    const warn = vi.fn();

    registry.spawn(
      "scenario_elements",
      [{ id: 20, type: "platform", x: 0, y: 0 }],
      context,
      warn
    );
    registry.spawn(
      "objects",
      [{ id: 21, type: "platform", x: 0, y: 0 }],
      context,
      warn
    );

    expect(calls).toEqual([["platform", 20]]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("has the six kinds of the game", () => {
    expect(registry.getClasses()).toEqual([
      "room",
      "save_point",
      "spawn_point",
      "marker",
      "door",
      "platform",
    ]);
  });
});
