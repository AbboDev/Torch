import { describe, expect, it } from "vitest";
import {
  DOOR_SCHEMA,
  OBJECT_SCHEMAS,
  PLATFORM_DEFAULT_SPEED,
  PLATFORM_SCHEMA,
  ROOM_SCHEMA,
  parseProperties,
} from "@/world/objectSchemas";

const props = (...list: [string, unknown][]) => ({
  properties: list.map(([name, value]) => ({ name, value })),
});

describe("parseProperties", () => {
  it("gives the defaults to an object with no properties", () => {
    const { values, problems, isBroken } = parseProperties(PLATFORM_SCHEMA, {});

    expect(values).toEqual({
      speed: PLATFORM_DEFAULT_SPEED,
      direction: "horizontal",
      distance: 0,
    });
    expect(problems).toEqual([]);
    expect(isBroken).toBe(false);
  });

  it("reads the properties which are set", () => {
    const { values, problems } = parseProperties(
      PLATFORM_SCHEMA,
      props(["speed", 10], ["direction", "vertical"], ["distance", 3])
    );

    expect(values).toEqual({ speed: 10, direction: "vertical", distance: 3 });
    expect(problems).toEqual([]);
  });

  it("tells about a property which is not known, which is how typos show", () => {
    const { values, problems } = parseProperties(
      PLATFORM_SCHEMA,
      props(["speeed", 10])
    );

    expect(problems).toEqual(['unknown property "speeed"']);
    expect(values.speed).toBe(PLATFORM_DEFAULT_SPEED);
  });

  it("falls back to the default for a value of the wrong type", () => {
    const { values, problems } = parseProperties(
      PLATFORM_SCHEMA,
      props(["speed", "fast"], ["distance", 2.5])
    );

    expect(problems).toHaveLength(2);
    expect(values.speed).toBe(PLATFORM_DEFAULT_SPEED);
    expect(values.distance).toBe(0);
  });

  it("accepts an int for a float", () => {
    expect(
      parseProperties(PLATFORM_SCHEMA, props(["speed", 24])).values.speed
    ).toBe(24);
  });

  it("refuses a value which is not allowed", () => {
    const { values, problems } = parseProperties(
      PLATFORM_SCHEMA,
      props(["direction", "diagonal"])
    );

    expect(problems[0]).toContain(
      "should be one of horizontal, vertical, both"
    );
    expect(values.direction).toBe("horizontal");
  });

  it("refuses a number which is too low", () => {
    const { values, problems } = parseProperties(
      PLATFORM_SCHEMA,
      props(["distance", -2])
    );

    expect(problems[0]).toContain("at least 0");
    expect(values.distance).toBe(0);
  });

  it("checks that a color looks like one, and allows no color at all", () => {
    expect(
      parseProperties(ROOM_SCHEMA, props(["dark", "000000"])).problems
    ).toEqual([]);
    expect(
      parseProperties(ROOM_SCHEMA, props(["dark", "#1a2b3c"])).problems
    ).toEqual([]);
    expect(parseProperties(ROOM_SCHEMA, props(["dark", ""])).problems).toEqual(
      []
    );
    expect(
      parseProperties(ROOM_SCHEMA, props(["dark", "dark"])).problems
    ).toHaveLength(1);
  });

  it("only allows the backgrounds of the table", () => {
    expect(
      parseProperties(ROOM_SCHEMA, props(["background", "laboratory"])).problems
    ).toEqual([]);
    expect(
      parseProperties(ROOM_SCHEMA, props(["background", "cave"])).problems
    ).toHaveLength(1);
  });

  describe("a required property", () => {
    it("makes the object broken when it is missing", () => {
      const result = parseProperties(DOOR_SCHEMA, {});

      expect(result.isBroken).toBe(true);
      expect(result.problems).toEqual([
        'missing the required property "target"',
      ]);
    });

    it("makes it broken when it is none (0), as Tiled says for no object", () => {
      expect(parseProperties(DOOR_SCHEMA, props(["target", 0])).isBroken).toBe(
        true
      );
    });

    it("is an object, or a name", () => {
      expect(
        parseProperties(DOOR_SCHEMA, props(["target", 12])).values.target
      ).toBe(12);
      expect(
        parseProperties(DOOR_SCHEMA, props(["target", "exit"])).values.target
      ).toBe("exit");
      expect(
        parseProperties(DOOR_SCHEMA, props(["target", true])).isBroken
      ).toBe(true);
    });
  });
});

describe("the schemas of the game", () => {
  it("have one class each, and nothing is in two", () => {
    const classes = OBJECT_SCHEMAS.map((schema) => schema.class);

    expect(new Set(classes).size).toBe(classes.length);
    expect(classes).toEqual([
      "room",
      "door",
      "save_point",
      "spawn_point",
      "platform",
    ]);
  });

  it("have a default of the right type for every property which has one", () => {
    for (const schema of OBJECT_SCHEMAS) {
      for (const [name, spec] of Object.entries(schema.properties)) {
        if (spec.default !== undefined) {
          const parsed = parseProperties(schema, {
            properties: [{ name, value: spec.default }],
          });

          // (the required properties of the object are not what is checked here)
          expect(
            parsed.problems.filter((problem) => !problem.startsWith("missing")),
            `${schema.class}.${name}`
          ).toEqual([]);
        }
      }
    }
  });
});
