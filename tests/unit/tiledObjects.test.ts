import { describe, expect, it } from "vitest";
import {
  attachClasses,
  getObjectClass,
  getObjectProperty,
  readRawObjects,
} from "@/world/tiledObjects";
import { parseDoors } from "@/world/doors";

describe("getObjectClass", () => {
  it("reads the class, or the type of the Tiled before 1.9", () => {
    expect(getObjectClass({ class: "room" })).toBe("room");
    expect(getObjectClass({ type: "room" })).toBe("room");
  });

  it("prefers the class", () => {
    expect(getObjectClass({ class: "door", type: "room" })).toBe("door");
  });

  it("is an empty string for an object with none", () => {
    expect(getObjectClass({})).toBe("");
    expect(getObjectClass({ type: "" })).toBe("");
  });
});

describe("getObjectProperty", () => {
  it("reads a property, or undefined", () => {
    const object = { properties: [{ name: "speed", value: 10 }] };

    expect(getObjectProperty(object, "speed")).toBe(10);
    expect(getObjectProperty(object, "distance")).toBeUndefined();
    expect(getObjectProperty({}, "speed")).toBeUndefined();
  });
});

describe("readRawObjects and attachClasses", () => {
  // The JSON written by Tiled 1.9 and later: the objects have a class, and
  // Phaser read them with no type
  const raw = {
    layers: [
      { name: "ground", type: "tilelayer" },
      {
        name: "objects",
        type: "objectgroup",
        objects: [
          { id: 3, class: "room" },
          { id: 4, class: "door" },
          { id: 5 },
        ],
      },
      {
        name: "scenario_elements",
        type: "objectgroup",
        objects: [{ id: 19, type: "platform" }],
      },
    ],
  };

  it("finds the objects of a layer", () => {
    expect(readRawObjects(raw, "objects")).toHaveLength(3);
    expect(readRawObjects(raw, "scenario_elements")).toHaveLength(1);
  });

  it("finds nothing for a layer which is not there, or no map", () => {
    expect(readRawObjects(raw, "ground")).toEqual([]);
    expect(readRawObjects(raw, "nowhere")).toEqual([]);
    expect(readRawObjects(undefined, "objects")).toEqual([]);
  });

  it("gives the objects the class of the raw JSON", () => {
    const parsed = [{ id: 3, name: "a" }, { id: 4 }, { id: 5 }, { id: 99 }];

    const withClasses = attachClasses(parsed, readRawObjects(raw, "objects"));

    expect(withClasses.map((object) => getObjectClass(object))).toEqual([
      "room",
      "door",
      "",
      "",
    ]);
    // the rest of the object is not touched
    expect(withClasses[0]).toMatchObject({ id: 3, name: "a" });
  });

  it("takes the type of the old Tiled too", () => {
    const [platform] = attachClasses(
      [{ id: 19 }],
      readRawObjects(raw, "scenario_elements")
    );

    expect(getObjectClass(platform)).toBe("platform");
  });

  it("does not change a class the object already has", () => {
    const [object] = attachClasses(
      [{ id: 3, class: "door" }],
      [{ id: 3, class: "room" }]
    );

    expect(object.class).toBe("door");
  });

  it("makes the doors work in a map saved by a recent Tiled", () => {
    const parsed = attachClasses(
      [
        { id: 50, name: "exit", x: 640, y: 320 },
        {
          id: 7,
          x: 100,
          y: 200,
          width: 16,
          height: 32,
          properties: [{ name: "target", value: 50 }],
        },
      ],
      [{ id: 50 }, { id: 7, class: "door" }]
    );

    expect(parseDoors(parsed)).toHaveLength(1);
  });
});
