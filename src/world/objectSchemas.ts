import { BACKGROUNDS } from "@/config/backgrounds";
import { TILE_SIZE } from "@/config/tiles";
import { TiledObjectLike } from "@/world/tiledObjects";

/**
 * What every kind of object of a Tiled map has: its custom properties, with
 * their type and default, and whether they are required. One description
 * for everything which needs it: reading the properties, checking the maps
 * in the tests, and the files of the Tiled project (so Tiled offers the same
 * properties). No dependency on Phaser.
 */

/** The types of the custom properties of Tiled */
export type PropertyType =
  "string" | "int" | "float" | "bool" | "color" | "file" | "object";

export interface PropertySpec {
  /** The type to give it in Tiled */
  type: PropertyType;
  /** Other types the property may have in a map (a door's target: a name too) */
  alsoAccepts?: readonly PropertyType[];
  /** What it is when the map does not set it, and what Tiled starts it with */
  default?: string | number | boolean;
  /** The map has to set it (an object reference to 0 is not set) */
  required?: boolean;
  /** The only values it can have (besides the default) */
  oneOf?: readonly string[];
  /** The lowest value of a number */
  min?: number;
  /** The text a string has to match (besides the default) */
  pattern?: RegExp;
  description: string;
}

export interface ObjectSchema {
  /** The class of the object in Tiled */
  class: string;
  /** The color of the object in the editor of Tiled */
  color: string;
  description: string;
  /** The layer of objects of the map where this kind of object goes */
  layer: string;
  /** The object needs a name: it is how a save or a script finds it */
  requiresName?: boolean;
  properties: Readonly<Record<string, PropertySpec>>;
}

/** Where a moving platform moves */
export enum PlatformDirection {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
  BOTH = "both",
}

export const PLATFORM_DIRECTIONS: readonly string[] =
  Object.values(PlatformDirection);

/** The speed of a moving platform when the map does not say */
export const PLATFORM_DEFAULT_SPEED = TILE_SIZE * 3;

export const ROOM_SCHEMA: ObjectSchema = {
  class: "room",
  layer: "objects",
  color: "#ff4f9fe0",
  description:
    "A room: the camera is limited to it. Rooms which touch share a border.",
  properties: {
    background: {
      type: "string",
      default: "",
      oneOf: Object.keys(BACKGROUNDS),
      description: "The background of the room (config/backgrounds.ts)",
    },
    dark: {
      type: "string",
      default: "",
      pattern: /^#?[0-9a-fA-F]{6}$/,
      description: "The ambient color of the room, as RRGGBB",
    },
  },
};

export const DOOR_SCHEMA: ObjectSchema = {
  class: "door",
  layer: "objects",
  color: "#ffe0a040",
  description: "Takes the Player somewhere else in the map, or in another one.",
  properties: {
    target: {
      type: "object",
      alsoAccepts: ["string"],
      required: true,
      description: "Where the Player appears (an object, or the name of one)",
    },
    targetMap: {
      type: "string",
      default: "",
      description: "The name of another map, when the target is there",
    },
    requiresUp: {
      type: "bool",
      default: false,
      description: "The Player has to press Up inside the door",
    },
  },
};

export const SAVE_POINT_SCHEMA: ObjectSchema = {
  class: "save_point",
  layer: "objects",
  color: "#ff50c878",
  description: "Where the game is saved and restarts. Its name is its id.",
  requiresName: true,
  properties: {},
};

export const SPAWN_POINT_SCHEMA: ObjectSchema = {
  class: "spawn_point",
  layer: "objects",
  color: "#ffe04f4f",
  description: "Where the Player starts a new game.",
  properties: {},
};

export const MARKER_SCHEMA: ObjectSchema = {
  class: "marker",
  layer: "objects",
  color: "#ffb0b0b0",
  description:
    "A place in the map which other objects refer to, like where a door leads.",
  properties: {},
};

export const PLATFORM_SCHEMA: ObjectSchema = {
  class: "platform",
  layer: "scenario_elements",
  color: "#ff9b59b6",
  description: "A moving platform, in the layer scenario_elements.",
  properties: {
    speed: {
      type: "float",
      default: PLATFORM_DEFAULT_SPEED,
      min: 0,
      description: "Pixels per second",
    },
    direction: {
      type: "string",
      default: PlatformDirection.HORIZONTAL,
      oneOf: PLATFORM_DIRECTIONS,
      description: "Where it moves",
    },
    distance: {
      type: "int",
      default: 0,
      min: 0,
      description:
        "How far it moves before turning back, in tiles (0: until a wall)",
    },
  },
};

/** Every kind of object the game knows */
export const OBJECT_SCHEMAS: readonly ObjectSchema[] = [
  ROOM_SCHEMA,
  DOOR_SCHEMA,
  SAVE_POINT_SCHEMA,
  SPAWN_POINT_SCHEMA,
  MARKER_SCHEMA,
  PLATFORM_SCHEMA,
];

export type PropertyValue = string | number | boolean;

export interface ParsedProperties {
  /** Every property of the schema, with the default where the map has none */
  values: Record<string, PropertyValue | undefined>;
  /** What is wrong, one text each (the object is still given its defaults) */
  problems: string[];
  /** A required property is missing or wrong: the object can not work */
  isBroken: boolean;
}

function fits(type: PropertyType, value: unknown): boolean {
  switch (type) {
    case "string":
    case "color":
    case "file":
      return typeof value === "string";
    case "int":
      return Number.isInteger(value);
    case "float":
      return typeof value === "number" && Number.isFinite(value);
    case "bool":
      return typeof value === "boolean";
    case "object":
      // The id of an object of the map; 0 is Tiled's "none"
      return Number.isInteger(value) && (value as number) > 0;
    default:
      return false;
  }
}

/**
 * The custom properties of an object, as its schema describes them:
 * the defaults filled in, and a list of what is wrong (an unknown property,
 * a value of the wrong type, one which is not allowed, a required one missing).
 */
export function parseProperties(
  schema: ObjectSchema,
  object: Pick<TiledObjectLike, "properties">
): ParsedProperties {
  const values: ParsedProperties["values"] = {};
  const problems: string[] = [];
  let isBroken = false;

  const given = new Map(
    (object.properties ?? []).map((property) => [property.name, property])
  );

  for (const name of given.keys()) {
    if (!Object.hasOwn(schema.properties, name)) {
      problems.push(`unknown property "${name}"`);
    }
  }

  for (const [name, spec] of Object.entries(schema.properties)) {
    const property = given.get(name);
    values[name] = spec.default;

    if (!property) {
      if (spec.required) {
        problems.push(`missing the required property "${name}"`);
        isBroken = true;
      }

      continue;
    }

    const value = property.value;
    const types = [spec.type, ...(spec.alsoAccepts ?? [])];

    let problem: string | null = null;

    if (!types.some((type) => fits(type, value))) {
      problem = `"${name}" should be a ${types.join(" or ")}, it is ${JSON.stringify(value)}`;
    } else if (value !== spec.default) {
      if (spec.oneOf && !spec.oneOf.includes(value as string)) {
        problem = `"${name}" is ${JSON.stringify(value)}: it should be one of ${spec.oneOf.join(", ")}`;
      } else if (spec.pattern && !spec.pattern.test(value as string)) {
        problem = `"${name}" is ${JSON.stringify(value)}: it does not look like ${spec.pattern}`;
      } else if (
        spec.min !== undefined &&
        typeof value === "number" &&
        value < spec.min
      ) {
        problem = `"${name}" is ${value}: it should be at least ${spec.min}`;
      }
    }

    if (problem) {
      problems.push(problem);

      if (spec.required) {
        isBroken = true;
      }

      continue;
    }

    values[name] = value as PropertyValue;
  }

  return { values, problems, isBroken };
}
