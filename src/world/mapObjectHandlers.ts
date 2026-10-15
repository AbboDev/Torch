import { Door, MapObject, buildDoor } from "@/world/doors";
import { ObjectRegistry } from "@/world/objectRegistry";
import {
  DOOR_SCHEMA,
  MARKER_SCHEMA,
  PLATFORM_SCHEMA,
  PropertyValue,
  ROOM_SCHEMA,
  SAVE_POINT_SCHEMA,
  SPAWN_POINT_SCHEMA,
} from "@/world/objectSchemas";

/**
 * What the objects of a map are added to: the scene implements it. The
 * handlers below only say which object is what; they do not know the scene.
 */
export interface MapObjectContext<Item extends MapObject = MapObject> {
  addRoom(room: Item): void;
  addSavePoint(savePoint: Item): void;
  setSpawnPoint(spawnPoint: Item): void;
  addDoor(door: Door): void;
  addPlatform(
    platform: Item,
    values: Record<string, PropertyValue | undefined>
  ): void;
}

/**
 * The kinds of objects of a map of the game. To add one: a schema in
 * objectSchemas.ts, a method of the context, and a handler here.
 */
export function createMapObjectRegistry<Item extends MapObject = MapObject>() {
  return new ObjectRegistry<MapObjectContext<Item>, Item>()
    .register({
      schema: ROOM_SCHEMA,
      create: (room, _values, context) => context.addRoom(room),
    })
    .register({
      schema: SAVE_POINT_SCHEMA,
      create: (savePoint, _values, context) => context.addSavePoint(savePoint),
    })
    .register({
      schema: SPAWN_POINT_SCHEMA,
      create: (spawnPoint, _values, context) =>
        context.setSpawnPoint(spawnPoint),
    })
    .register({
      // Nothing to make: it is only a place, which a door finds in its layer
      schema: MARKER_SCHEMA,
      create: () => {},
    })
    .register({
      schema: DOOR_SCHEMA,
      create: (object, values, context, layer) => {
        const result = buildDoor(object, values, layer);

        if ("problem" in result) {
          return result.problem;
        }

        context.addDoor(result.door);
      },
    })
    .register({
      schema: PLATFORM_SCHEMA,
      create: (platform, values, context) =>
        context.addPlatform(platform, values),
    });
}
