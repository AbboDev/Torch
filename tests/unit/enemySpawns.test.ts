import { describe, expect, it, vi } from "vitest";
import { ENEMY_DEFINITIONS, ENEMY_KINDS, isEnemyKind } from "@/config/enemies";
import { DOWN, LEFT, RIGHT, UP } from "@/enemies/crawl";
import { parseEnemySpawns } from "@/enemies/spawns";

const enemy = (
  id: number,
  properties: Array<{ name: string; value: unknown }> = [],
  size: { width?: number; height?: number } = {}
) => ({ id, type: "enemy", x: 100, y: 200, properties, ...size });

describe("ENEMY_DEFINITIONS", () => {
  it("has a walker", () => {
    expect(ENEMY_KINDS).toContain("walker");
  });

  it("gives every kind what it needs to be an enemy", () => {
    for (const kind of ENEMY_KINDS) {
      const definition = ENEMY_DEFINITIONS[kind];

      expect(definition.life).toBeGreaterThan(0);
      expect(definition.width).toBeGreaterThan(0);
      expect(definition.height).toBeGreaterThan(0);
      expect(definition.speed).toBeGreaterThan(0);
      expect(definition.contact.amount).toBeGreaterThan(0);
      expect(definition.contactCooldown).toBeGreaterThan(0);
      expect(definition.texture).not.toBe("");
    }
  });

  it("gives the enemies which jump an interval and a height", () => {
    const jumpers = ENEMY_KINDS.filter((kind) => "jump" in ENEMY_DEFINITIONS[kind]);

    expect(jumpers).toContain("jumper");
    for (const kind of jumpers) {
      const { jump } = ENEMY_DEFINITIONS[kind] as {
        jump: { interval: number; height: number };
      };

      expect(jump.interval).toBeGreaterThan(0);
      expect(jump.height).toBeGreaterThan(0);
    }
  });

  it("has a texture of its own for every kind", () => {
    const textures = ENEMY_KINDS.map((kind) => ENEMY_DEFINITIONS[kind].texture);

    expect(new Set(textures).size).toBe(textures.length);
  });

  it("knows a kind from what is not one", () => {
    expect(isEnemyKind("walker")).toBe(true);
    expect(isEnemyKind("dragon")).toBe(false);
    expect(isEnemyKind(3)).toBe(false);
    expect(isEnemyKind(undefined)).toBe(false);
  });
});

describe("parseEnemySpawns", () => {
  it("takes the objects of type enemy and leaves out the others", () => {
    const spawns = parseEnemySpawns([
      enemy(1),
      { id: 2, type: "platform", x: 0, y: 0 },
      { id: 3, name: "spawn_point", x: 0, y: 0 },
      enemy(4),
    ]);

    expect(spawns.map((spawn) => spawn.id)).toEqual(["enemy_1", "enemy_4"]);
  });

  it("is a walker which goes left if nothing is said", () => {
    expect(parseEnemySpawns([enemy(1)])[0]).toEqual({
      id: "enemy_1",
      kind: "walker",
      x: 100,
      y: 200,
      heading: -1,
      surface: DOWN,
      direction: LEFT,
    });
  });

  it("stands with its feet at the bottom and its middle at the middle of the object", () => {
    const [spawn] = parseEnemySpawns([enemy(1, [], { width: 32, height: 16 })]);

    expect(spawn.x).toBe(116);
    expect(spawn.y).toBe(216);
  });

  it("reads the kind and the direction", () => {
    const [spawn] = parseEnemySpawns([
      enemy(1, [
        { name: "kind", value: "walker" },
        { name: "direction", value: "right" },
      ]),
    ]);

    expect(spawn.kind).toBe("walker");
    expect(spawn.heading).toBe(1);
  });

  it("leaves out an enemy of a kind which does not exist, with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const spawns = parseEnemySpawns([
      enemy(1, [{ name: "kind", value: "dragon" }]),
      enemy(2),
    ]);

    expect(spawns.map((spawn) => spawn.id)).toEqual(["enemy_2"]);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("goes left, with a warning, for a direction which does not exist", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const [spawn] = parseEnemySpawns([
      enemy(1, [{ name: "direction", value: "up" }]),
    ]);

    expect(spawn.heading).toBe(-1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("reads the surface an enemy clings to and the way it goes along it", () => {
    const [onWall, onCeiling] = parseEnemySpawns([
      enemy(1, [
        { name: "surface", value: "right" },
        { name: "direction", value: "down" },
      ]),
      enemy(2, [
        { name: "surface", value: "up" },
        { name: "direction", value: "right" },
      ]),
    ]);

    expect(onWall.surface).toEqual(RIGHT);
    expect(onWall.direction).toEqual(DOWN);
    expect(onCeiling.surface).toEqual(UP);
    expect(onCeiling.direction).toEqual(RIGHT);
    expect(onCeiling.heading).toBe(1);
  });

  it("goes up a wall if no direction is given for a wall", () => {
    const [spawn] = parseEnemySpawns([enemy(1, [{ name: "surface", value: "left" }])]);

    expect(spawn.direction).toEqual(UP);
  });

  it("goes the default way, with a warning, if the direction is not along the surface", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const [floor, wall] = parseEnemySpawns([
      enemy(1, [{ name: "direction", value: "up" }]),
      enemy(2, [
        { name: "surface", value: "left" },
        { name: "direction", value: "right" },
      ]),
    ]);

    expect(floor.direction).toEqual(LEFT);
    expect(wall.direction).toEqual(UP);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("is on the floor, with a warning, for a surface which does not exist", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const [spawn] = parseEnemySpawns([
      enemy(1, [{ name: "surface", value: "sideways" }]),
    ]);

    expect(spawn.surface).toEqual(DOWN);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("has nothing for a map with no enemies", () => {
    expect(parseEnemySpawns([])).toEqual([]);
  });
});
