import { describe, expect, it } from "vitest";
import mapSource from "../../assets/maps/chozodia.json?raw";
import { Darkness } from "@/world/darkness";
import type { MapObject } from "@/world/doors";
import { Terrain, buildMinimapMap } from "@/world/minimap";

// A check of the minimap made from the real map: a mistake in Tiled shows up here
const map = JSON.parse(mapSource);

interface TileLayer {
  name: string;
  type: string;
  data: number[];
}

const layers: TileLayer[] = map.layers.filter(
  (layer: TileLayer) => layer.type === "tilelayer"
);
const objects: MapObject[] = map.layers
  .filter((layer: { name: string }) => layer.name === "objects")
  .flatMap((layer: { objects: MapObject[] }) => layer.objects);
const rooms = objects.filter((object) => object.type === "room");

const minimap = buildMinimapMap({
  cols: map.width,
  rows: map.height,
  tileSize: map.tilewidth,
  isFilled: (name, col, row) =>
    (layers.find((layer) => layer.name === name)?.data[row * map.width + col] ??
      0) !== 0,
  rooms,
  objects,
});

describe("the minimap of the map chozodia", () => {
  it("has a cell for every tile", () => {
    expect(minimap.cols).toBe(map.width);
    expect(minimap.rows).toBe(map.height);
    expect(minimap.terrain).toHaveLength(map.width * map.height);
  });

  it("has walls where the layer of the collisions has tiles", () => {
    const collision = layers.find((layer) => layer.name === "collision");

    expect(collision).toBeDefined();
    collision?.data.forEach((tile, index) => {
      if (tile !== 0) {
        expect(minimap.terrain[index]).toBe(Terrain.SOLID);
      }
    });
  });

  it("is drawn exactly inside the rooms", () => {
    const size = map.tilewidth;
    let expected = 0;

    for (let row = 0; row < map.height; row++) {
      for (let col = 0; col < map.width; col++) {
        // the middle of the tile is in a room (they share their borders)
        const x = col * size + size / 2;
        const y = row * size + size / 2;
        const inRoom = rooms.some(
          (room) =>
            x >= (room.x ?? 0) &&
            x < (room.x ?? 0) + (room.width ?? 0) &&
            y >= (room.y ?? 0) &&
            y < (room.y ?? 0) + (room.height ?? 0)
        );

        expect(minimap.roomOf[row * map.width + col] >= 0).toBe(inRoom);
        expected += inRoom ? 1 : 0;
      }
    }

    expect(expected).toBeGreaterThan(0);
  });

  it("has the place where the Player starts inside a room", () => {
    const spawn = objects.find((object) => object.name === "spawn_point");
    const col = Math.floor((spawn?.x ?? 0) / map.tilewidth);
    const row = Math.floor((spawn?.y ?? 0) / map.tileheight);

    expect(minimap.roomOf[row * map.width + col]).toBeGreaterThan(-1);
  });

  it("knows which rooms are dark, as the game does", () => {
    const flags = rooms.map((room, index) => [
      room.name,
      minimap.rooms[index].darkness === Darkness.DARK,
    ]);

    // the two rooms below have the property dark in Tiled, the first one has not
    expect(flags).toEqual(
      rooms.map((room) => [
        room.name,
        room.properties?.some((p) => p.name === "dark") ?? false,
      ])
    );
    expect(minimap.rooms.some((room) => room.darkness === Darkness.DARK)).toBe(true);
    expect(minimap.rooms.some((room) => room.darkness === Darkness.NONE)).toBe(true);
  });

  it("has every point of interest inside a room, or it would never be seen", () => {
    for (const poi of minimap.pois) {
      expect(minimap.roomOf[poi.row * map.width + poi.col], poi.id).toBeGreaterThan(-1);
    }
  });
});
