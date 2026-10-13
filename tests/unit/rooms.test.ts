import { describe, expect, it } from "vitest";
import {
  findRoomIndex,
  getRoomId,
  resolveRoom,
  roomContains,
} from "@/world/rooms";

// The rooms of assets/maps/chozodia.json
const bottom = { id: 3, x: 448, y: 320, width: 1280, height: 176 };
const start = { id: 6, x: 448, y: 0, width: 1280, height: 320 };
const left = { id: 18, x: 0, y: 144, width: 448, height: 176 };
const rooms = [bottom, start, left];

describe("roomContains", () => {
  it("includes the left and top borders and excludes the right and bottom ones", () => {
    expect(roomContains(start, 448, 0)).toBe(true);
    expect(roomContains(start, 1727.9, 319.9)).toBe(true);
    expect(roomContains(start, 1728, 100)).toBe(false);
    expect(roomContains(start, 500, 320)).toBe(false);
  });

  it("treats a missing size as an empty room", () => {
    expect(roomContains({ x: 10, y: 10 }, 10, 10)).toBe(false);
  });
});

describe("findRoomIndex", () => {
  it("finds the room of a point", () => {
    expect(findRoomIndex(rooms, 600, 100)).toBe(1);
    expect(findRoomIndex(rooms, 600, 400)).toBe(0);
    expect(findRoomIndex(rooms, 100, 200)).toBe(2);
  });

  it("puts a point on a shared border in exactly one room", () => {
    // between the left room and the start room
    expect(findRoomIndex(rooms, 448, 200)).toBe(1);
    expect(findRoomIndex(rooms, 447.99, 200)).toBe(2);
    // between the start room and the bottom room
    expect(findRoomIndex(rooms, 600, 320)).toBe(0);
    expect(findRoomIndex(rooms, 600, 319.99)).toBe(1);
  });

  it("returns null outside every room", () => {
    expect(findRoomIndex(rooms, 5000, 5000)).toBeNull();
    expect(findRoomIndex([], 0, 0)).toBeNull();
  });

  it("stays in the current room where rooms overlap", () => {
    const a = { id: 1, x: 0, y: 0, width: 100, height: 100 };
    const b = { id: 2, x: 50, y: 0, width: 100, height: 100 };

    expect(findRoomIndex([a, b], 75, 50)).toBe(0);
    expect(findRoomIndex([a, b], 75, 50, 1)).toBe(1);
    // ... unless the point is no longer in it
    expect(findRoomIndex([a, b], 20, 50, 1)).toBe(0);
  });
});

describe("resolveRoom", () => {
  it("is not outside when the point is in a room", () => {
    expect(resolveRoom(rooms, 600, 100)).toEqual({ index: 1, outside: false });
  });

  it("falls back to the closest room instead of failing", () => {
    // below the bottom room
    expect(resolveRoom(rooms, 600, 600)).toEqual({ index: 0, outside: true });
    // far on the left of the left room
    expect(resolveRoom(rooms, -50, 200)).toEqual({ index: 2, outside: true });
    // a gap between two rooms
    const a = { id: 1, x: 0, y: 0, width: 100, height: 100 };
    const b = { id: 2, x: 120, y: 0, width: 100, height: 100 };
    expect(resolveRoom([a, b], 105, 50).index).toBe(0);
    expect(resolveRoom([a, b], 115, 50).index).toBe(1);
  });

  it("has no room when the map has none", () => {
    expect(resolveRoom([], 0, 0)).toEqual({ index: null, outside: true });
  });
});

describe("getRoomId", () => {
  it("is unique even for rooms with the same name in Tiled", () => {
    expect(getRoomId(bottom, "chozodia")).not.toBe(getRoomId(left, "chozodia"));
    expect(getRoomId(bottom, "chozodia")).toBe("chozodia/room_3");
  });

  it("is not the same in two maps which have an object with the same id", () => {
    expect(getRoomId(bottom, "chozodia")).not.toBe(getRoomId(bottom, "cave"));
  });
});
