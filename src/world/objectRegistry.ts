import {
  ObjectSchema,
  PropertyValue,
  parseProperties,
} from "@/world/objectSchemas";
import { TiledObjectLike, getObjectClass } from "@/world/tiledObjects";

/**
 * What to do with the objects of a kind: the registry finds the handler of the
 * class of an object, checks its properties with the schema of the handler, and
 * lets the handler create it. A new kind of object (an enemy, a pickup, a
 * switch) is a schema and a handler, not another `if` in a scene.
 * No dependency on Phaser.
 */
export interface ObjectHandler<Context, Item extends TiledObjectLike> {
  schema: ObjectSchema;
  /**
   * Make what the object stands for
   *
   * @param object  The object, as in the map
   * @param values  Its properties, with the defaults, already checked
   * @param context What the handler adds to
   * @param layer   All the objects of the layer it is in (a door finds its target there)
   */
  create(
    object: Item,
    values: Record<string, PropertyValue | undefined>,
    context: Context,
    layer: readonly Item[]
  ): void;
}

export interface SpawnReport {
  /** The objects which were made */
  created: number;
  /** The objects left out, with the reason */
  skipped: { id: number; reason: string }[];
}

/**
 * The kind of an object. An object with no class but the name of a spawn point
 * is one (so the old maps, where the spawn point had no class, still work).
 */
export function resolveClass(object: TiledObjectLike): string {
  const kind = getObjectClass(object);

  return kind === "" && object.name === "spawn_point" ? "spawn_point" : kind;
}

export class ObjectRegistry<
  Context,
  Item extends TiledObjectLike = TiledObjectLike,
> {
  private readonly handlers = new Map<string, ObjectHandler<Context, Item>>();

  public register(handler: ObjectHandler<Context, Item>): this {
    const name = handler.schema.class;

    if (this.handlers.has(name)) {
      throw new Error(`There is already a handler for the class "${name}"`);
    }

    this.handlers.set(name, handler);

    return this;
  }

  public has(className: string): boolean {
    return this.handlers.has(className);
  }

  /** The classes the registry can make */
  public getClasses(): string[] {
    return [...this.handlers.keys()];
  }

  /**
   * Make the objects of a layer of the map. What is wrong in an object does not
   * stop the others: it is told in `warn` and the object is left out.
   *
   * @param layerName The name of the layer of objects in Tiled
   * @param objects   Its objects
   */
  public spawn(
    layerName: string,
    objects: readonly Item[],
    context: Context,
    warn: (message: string) => void = console.warn
  ): SpawnReport {
    const report: SpawnReport = { created: 0, skipped: [] };
    const unknownClasses = new Set<string>();

    const skip = (object: Item, reason: string) => {
      report.skipped.push({ id: object.id, reason });
      warn(
        `Object ${object.id} of the layer "${layerName}" ${reason}: it is ignored`
      );
    };

    for (const object of objects) {
      const kind = resolveClass(object);

      if (kind === "") {
        skip(object, "has no class");
        continue;
      }

      const handler = this.handlers.get(kind);

      if (!handler) {
        if (!unknownClasses.has(kind)) {
          unknownClasses.add(kind);
          warn(
            `The game does not know the class "${kind}" (layer "${layerName}")`
          );
        }

        report.skipped.push({
          id: object.id,
          reason: `has the unknown class "${kind}"`,
        });
        continue;
      }

      const { schema } = handler;

      if (schema.layer !== layerName) {
        skip(object, `is a ${kind}, which goes in the layer "${schema.layer}"`);
        continue;
      }

      if (schema.requiresName && !object.name) {
        skip(object, `is a ${kind} and needs a name`);
        continue;
      }

      const { values, problems, isBroken } = parseProperties(schema, object);

      if (isBroken) {
        skip(
          object,
          `is a ${kind} with a wrong property (${problems.join("; ")})`
        );
        continue;
      }

      for (const problem of problems) {
        warn(`${kind} ${object.id}: ${problem}`);
      }

      handler.create(object, values, context, objects);
      report.created++;
    }

    return report;
  }
}
