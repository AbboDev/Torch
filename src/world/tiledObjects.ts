/**
 * Reading the objects of a Tiled map, with no dependency on Phaser.
 *
 * Tiled calls the kind of an object `type` up to version 1.8 and `class` after
 * it, and the JSON of the map has the one its version writes. Phaser keeps
 * only `type` when it reads the map, so the class has to be taken from the
 * raw JSON (`attachClasses`).
 */

export interface TiledPropertyLike {
  name: string;
  type?: string;
  value?: unknown;
}

export interface TiledObjectLike {
  id: number;
  name?: string;
  type?: string;
  class?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  properties?: TiledPropertyLike[];
}

/** The kind of an object ("room", "door", "platform"...), or "" if it has none */
export function getObjectClass(
  object: Pick<TiledObjectLike, "type" | "class">
): string {
  return object.class || object.type || "";
}

/** The value of a custom property of an object, or undefined */
export function getObjectProperty(
  object: Pick<TiledObjectLike, "properties">,
  name: string
): unknown {
  return object.properties?.find((property) => property.name === name)?.value;
}

/** The part of the objects of a raw Tiled map which carries the class */
interface RawObject {
  id: number;
  type?: string;
  class?: string;
}

interface RawMap {
  layers?: { name?: string; type?: string; objects?: RawObject[] }[];
}

/** The objects of a layer of the raw JSON of a Tiled map */
export function readRawObjects(raw: unknown, layerName: string): RawObject[] {
  const layer = (raw as RawMap | undefined)?.layers?.find(
    (candidate) =>
      candidate.type === "objectgroup" && candidate.name === layerName
  );

  return layer?.objects ?? [];
}

/**
 * Give the objects Phaser read the class they have in the raw JSON.
 * An object which already has one keeps it.
 */
export function attachClasses<T extends { id: number }>(
  objects: readonly (T & { class?: string })[],
  raw: readonly RawObject[]
): (T & { class?: string })[] {
  const classes = new Map<number, string>();

  for (const object of raw) {
    const kind = getObjectClass(object);

    if (kind) {
      classes.set(object.id, kind);
    }
  }

  return objects.map((object) => {
    const kind = classes.get(object.id);

    return kind && !object.class ? { ...object, class: kind } : object;
  });
}
