import { describe, expect, it, vi } from "vitest";
import mapSource from "../../assets/maps/chozodia.json?raw";
import { BACKGROUNDS } from "@/config/backgrounds";
import { MapObject, parseDoors } from "@/world/doors";
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
