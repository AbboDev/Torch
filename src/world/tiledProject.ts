import {
  OBJECT_SCHEMAS,
  ObjectSchema,
  PropertyType,
} from "@/world/objectSchemas";

/**
 * The files of the Tiled project, made from the schemas of the objects: Tiled
 * then offers the same classes and properties, with the same defaults, which
 * the game reads and checks. No dependency on Phaser or on the file system.
 *
 * Run `npm run tiled:project` after changing a schema; a test fails if the
 * files in assets/ are not the ones the schemas make.
 */

/** What Tiled starts a property with when the schema gives no default */
const EMPTY_VALUES: Record<PropertyType, string | number | boolean> = {
  string: "",
  int: 0,
  float: 0,
  bool: false,
  color: "",
  file: "",
  object: 0,
};

/** An object type, in the file of the object types of Tiled */
export interface TiledObjectType {
  color: string;
  name: string;
  properties: {
    name: string;
    type: PropertyType;
    value: string | number | boolean;
  }[];
}

export function getObjectType(schema: ObjectSchema): TiledObjectType {
  return {
    color: schema.color,
    name: schema.class,
    properties: Object.entries(schema.properties).map(([name, spec]) => ({
      name,
      type: spec.type,
      value: spec.default ?? EMPTY_VALUES[spec.type],
    })),
  };
}

/** The file of the object types: one for every kind of object of the game */
export function getObjectTypes(
  schemas: readonly ObjectSchema[] = OBJECT_SCHEMAS
): TiledObjectType[] {
  return schemas.map(getObjectType);
}

/** The Tiled project: it finds the maps and tilesets and the object types */
export function getProjectFile() {
  return {
    automappingRulesFile: "",
    commands: [],
    extensionsPath: "extensions",
    folders: ["maps", "tilesets"],
    objectTypesFile: "objecttypes.json",
    propertyTypes: [],
  };
}

/** How the files are written: indented, with a line at the end */
export function toFile(value: unknown): string {
  return `${JSON.stringify(value, null, 4)}\n`;
}

/** The names and the contents of the files of the project, in assets/ */
export function getTiledProjectFiles(): Record<string, string> {
  return {
    "torch.tiled-project": toFile(getProjectFile()),
    "objecttypes.json": toFile(getObjectTypes()),
  };
}
