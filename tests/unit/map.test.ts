import { describe, expect, it, vi } from "vitest";
import mapSource from "../../assets/maps/chozodia.json?raw";
import { BACKGROUNDS } from "@/config/backgrounds";
import { MapObject, parseDoors } from "@/world/doors";
import { createMapObjectRegistry } from "@/world/mapObjectHandlers";
import { getRoomProperty } from "@/world/rooms";
import { getObjectClass } from "@/world/tiledObjects";

// A check of the data of the real map: a mistake in Tiled shows up here
const map = JSON.parse(mapSource);
const objects: MapObject[] = map.layers
  .filter((layer: { name: string }) => layer.name === "objects")
  .flatMap((layer: { objects: MapObject[] }) => layer.objects);

const rooms = objects.filter((object) => getObjectClass(object) === "room");

describe("the map chozodia", () => {
  it("has rooms with a size, and unique ids", () => {
    expect(rooms.length).toBeGreaterThan(0);

    for (const room of rooms) {
      expect(room.width, `room ${room.id}`).toBeGreaterThan(0);
      expect(room.height, `room ${room.id}`).toBeGreaterThan(0);
    }

    expect(new Set(rooms.map((room) => room.id)).size).toBe(rooms.length);
  });

  it("only uses backgrounds which exist", () => {
    for (const room of rooms) {
      const background = getRoomProperty(room, "background");

      if (background !== undefined) {
        expect(Object.keys(BACKGROUNDS), `room ${room.id}`).toContain(
          background
        );
      }
    }
  });

  it("has exactly one spawn point", () => {
    expect(
      objects.filter((object) => object.name === "spawn_point")
    ).toHaveLength(1);
  });

  it("has doors which all work", () => {
    const warn = vi.fn();
    const doors = parseDoors(objects, warn);

    expect(warn).not.toHaveBeenCalled();
    expect(doors).toHaveLength(
      objects.filter((object) => getObjectClass(object) === "door").length
    );
  });
});

describe("the objects of the map chozodia, made as the game makes them", () => {
  const layerObjects = (name: string): MapObject[] =>
    map.layers
      .filter((layer: { name: string }) => layer.name === name)
      .flatMap((layer: { objects: MapObject[] }) => layer.objects);

  it("makes every object, with nothing to say", () => {
    const registry = createMapObjectRegistry();
    const warn = vi.fn();
    const made = { room: 0, spawn: 0, savePoint: 0, door: 0, platform: 0 };

    const context = {
      addRoom: () => made.room++,
      addSavePoint: () => made.savePoint++,
      setSpawnPoint: () => made.spawn++,
      addDoor: () => made.door++,
      addPlatform: () => made.platform++,
    };

    for (const layer of ["objects", "scenario_elements"]) {
      const objects = layerObjects(layer);
      const report = registry.spawn(layer, objects, context, warn);

      expect(report.skipped, layer).toEqual([]);
      expect(report.created, layer).toBe(objects.length);
    }

    expect(warn).not.toHaveBeenCalled();
    expect(made.spawn).toBe(1);
    expect(made.room).toBe(rooms.length);
    expect(made.platform).toBe(layerObjects("scenario_elements").length);
  });
});
