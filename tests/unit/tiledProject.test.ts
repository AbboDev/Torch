import { describe, expect, it } from "vitest";
import project from "../../assets/torch.tiled-project?raw";
import objectTypes from "../../assets/objecttypes.json?raw";
import { OBJECT_SCHEMAS } from "@/world/objectSchemas";
import {
  getObjectType,
  getObjectTypes,
  getProjectFile,
  getTiledProjectFiles,
  toFile,
} from "@/world/tiledProject";

describe("the files of the Tiled project", () => {
  it("are the ones the schemas make: run `npm run tiled:project` if this fails", () => {
    const files = getTiledProjectFiles();

    expect(project).toBe(files["torch.tiled-project"]);
    expect(objectTypes).toBe(files["objecttypes.json"]);
  });

  it("point to the file of the object types, and to folders which exist", () => {
    const file = getProjectFile();

    expect(file.objectTypesFile).toBe("objecttypes.json");
    expect(Object.keys(getTiledProjectFiles())).toContain(file.objectTypesFile);
    expect(file.folders).toEqual(["maps", "tilesets"]);
  });
});

describe("the object types", () => {
  const types = getObjectTypes();

  it("have one entry for every kind of object, in the order of the schemas", () => {
    expect(types.map((type) => type.name)).toEqual(
      OBJECT_SCHEMAS.map((schema) => schema.class)
    );
  });

  it("have the properties of the schema, with its types and defaults", () => {
    const door = types.find((type) => type.name === "door")!;

    expect(door.properties).toEqual([
      { name: "target", type: "object", value: 0 },
      { name: "targetMap", type: "string", value: "" },
      { name: "requiresUp", type: "bool", value: false },
    ]);

    const platform = types.find((type) => type.name === "platform")!;

    expect(platform.properties).toEqual([
      { name: "speed", type: "float", value: 48 },
      { name: "direction", type: "string", value: "horizontal" },
      { name: "distance", type: "int", value: 0 },
    ]);
  });

  it("have no properties for the kinds which have none", () => {
    expect(
      types.find((type) => type.name === "save_point")!.properties
    ).toEqual([]);
  });

  it("start a property which has no default with the empty value of its type", () => {
    const type = getObjectType({
      class: "thing",
      layer: "objects",
      color: "#000000",
      description: "",
      properties: {
        a: { type: "string", description: "" },
        b: { type: "int", description: "" },
        c: { type: "bool", description: "" },
      },
    });

    expect(type.properties.map((property) => property.value)).toEqual([
      "",
      0,
      false,
    ]);
  });

  it("have a color each, which Tiled can read", () => {
    for (const type of types) {
      expect(type.color, type.name).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("toFile", () => {
  it("writes indented JSON with a line at the end", () => {
    expect(toFile({ a: 1 })).toBe('{\n    "a": 1\n}\n');
  });
});
