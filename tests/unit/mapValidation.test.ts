import { describe, expect, it } from "vitest";
import { GAME_REQUIREMENTS, validateMap } from "@/world/mapValidation";

type Obj = Record<string, unknown>;

/** A map which is right: change it to see what each check says */
function goodMap(): {
  tilewidth: number;
  tileheight: number;
  layers: Obj[];
  tilesets: Obj[];
} {
  return {
    tilewidth: 16,
    tileheight: 16,
    tilesets: GAME_REQUIREMENTS.tilesets.map((name) => ({ name })),
    layers: [
      ...GAME_REQUIREMENTS.tileLayers.map((name) => ({
        name,
        type: "tilelayer",
      })),
      {
        name: "objects",
        type: "objectgroup",
        objects: [
          {
            id: 1,
            type: "room",
            name: "a",
            x: 0,
            y: 0,
            width: 320,
            height: 176,
          },
          {
            id: 2,
            type: "room",
            name: "b",
            x: 320,
            y: 0,
            width: 320,
            height: 176,
          },
          { id: 3, name: "spawn_point", x: 32, y: 32 },
          { id: 4, type: "save_point", name: "lab", x: 100, y: 100 },
          { id: 5, type: "marker", name: "exit", x: 400, y: 100 },
          {
            id: 6,
            type: "door",
            x: 16,
            y: 16,
            width: 16,
            height: 32,
            properties: [{ name: "target", type: "object", value: 5 }],
          },
        ],
      },
      {
        name: "scenario_elements",
        type: "objectgroup",
        objects: [{ id: 7, type: "platform", x: 64, y: 64 }],
      },
    ],
  };
}

const objects = (map: ReturnType<typeof goodMap>, layer = "objects") =>
  (
    map.layers.find((candidate) => candidate.name === layer) as {
      objects: Obj[];
    }
  ).objects;

describe("validateMap", () => {
  it("has nothing to say about a map which is right", () => {
    expect(validateMap(goodMap())).toEqual({ errors: [], warnings: [] });
  });

  it("says a map which is nothing is wrong, and does not fail", () => {
    expect(validateMap(undefined).errors.length).toBeGreaterThan(0);
    expect(validateMap({}).errors.length).toBeGreaterThan(0);
  });

  describe("the layers and the tilesets", () => {
    it("wants the size of the tiles of the game", () => {
      const map = { ...goodMap(), tilewidth: 32, tileheight: 32 };

      expect(validateMap(map).errors[0]).toContain("32x32");
    });

    it("wants every tile layer the scene creates", () => {
      const map = goodMap();
      map.layers = map.layers.filter((layer) => layer.name !== "collision");

      expect(validateMap(map).errors).toEqual([
        'there is no tile layer "collision"',
      ]);
    });

    it("wants every tileset", () => {
      const map = goodMap();
      map.tilesets = map.tilesets.slice(1);

      expect(validateMap(map).errors).toEqual([
        'there is no tileset "chozodia"',
      ]);
    });

    it("wants the layer of the objects", () => {
      const map = goodMap();
      map.layers = map.layers.filter((layer) => layer.name !== "objects");

      expect(validateMap(map).errors).toContain(
        'there is no object layer "objects"'
      );
    });

    it("tells about an object layer the game does not read", () => {
      const map = goodMap();
      map.layers.push({ name: "notes", type: "objectgroup", objects: [] });

      expect(validateMap(map).warnings).toEqual([
        'the object layer "notes" is not read by the game',
      ]);
    });
  });

  describe("the objects", () => {
    it("reports an object the game would leave out", () => {
      const map = goodMap();
      objects(map).push({ id: 20, type: "ghost" });

      expect(validateMap(map).errors).toEqual([
        'object 20 of the layer "objects" has the unknown class "ghost"',
      ]);
    });

    it("reports an object in the wrong layer", () => {
      const map = goodMap();
      objects(map, "scenario_elements").push({
        id: 20,
        type: "room",
        x: 0,
        y: 0,
        width: 16,
        height: 16,
      });

      expect(validateMap(map).errors[0]).toContain(
        'goes in the layer "objects"'
      );
    });

    it("tells about a property written wrong, which does not stop the object", () => {
      const map = goodMap();
      objects(map, "scenario_elements")[0].properties = [
        { name: "speeed", value: 10 },
      ];

      const { errors, warnings } = validateMap(map);

      expect(errors).toEqual([]);
      expect(warnings).toEqual(['platform 7: unknown property "speeed"']);
    });

    it("reports an id used twice", () => {
      const map = goodMap();
      objects(map, "scenario_elements")[0].id = 5;

      expect(validateMap(map).errors).toContain(
        "the id 5 is used by two objects"
      );
    });
  });

  describe("the rooms", () => {
    it("wants at least one", () => {
      const map = goodMap();
      map.layers[map.layers.length - 2] = {
        name: "objects",
        type: "objectgroup",
        objects: [],
      };

      expect(validateMap(map).errors).toContain("there are no rooms");
    });

    it("reports rooms which overlap, but not rooms which share a border", () => {
      const map = goodMap();
      expect(validateMap(map).errors).toEqual([]);

      objects(map)[1].x = 300;

      expect(validateMap(map).errors).toEqual([
        'rooms 1 "a" and 2 "b" overlap',
      ]);
    });

    it("tells about rooms with the same name", () => {
      const map = goodMap();
      objects(map)[1].name = "a";

      expect(validateMap(map).warnings).toEqual([
        '2 rooms are called "a" (their ids are different, but the names are confusing)',
      ]);
    });

    it("reports a room with no size", () => {
      const map = goodMap();
      objects(map)[0].width = 0;

      expect(validateMap(map).errors).toContain('room 1 "a" has no size');
    });
  });

  describe("the spawn point and the save points", () => {
    it("wants exactly one spawn point", () => {
      const none = goodMap();
      none.layers[none.layers.length - 2] = {
        name: "objects",
        type: "objectgroup",
        objects: (objects(none) as Obj[]).filter(
          (object) => object.name !== "spawn_point"
        ),
      };
      expect(validateMap(none).errors).toEqual([
        "there must be one spawn point, there are 0",
      ]);

      const two = goodMap();
      objects(two).push({ id: 30, name: "spawn_point", x: 40, y: 40 });
      expect(validateMap(two).errors).toEqual([
        "there must be one spawn point, there are 2",
      ]);
    });

    it("wants them inside a room", () => {
      const map = goodMap();
      objects(map)[2].x = 5000;
      objects(map)[3].x = 5000;

      expect(validateMap(map).errors).toEqual([
        'the spawn point 3 "spawn_point" is not inside a room',
        'the save point 4 "lab" is not inside a room',
      ]);
    });

    it("wants the names of the save points to be different", () => {
      const map = goodMap();
      objects(map).push({
        id: 31,
        type: "save_point",
        name: "lab",
        x: 110,
        y: 100,
      });

      expect(validateMap(map).errors).toEqual([
        'two save points are called "lab"',
      ]);
    });

    it("wants a name for a save point", () => {
      const map = goodMap();
      delete objects(map)[3].name;

      expect(validateMap(map).errors[0]).toContain("needs a name");
    });

    it("tells when an area has no save point", () => {
      const map = goodMap();
      map.layers[map.layers.length - 2] = {
        name: "objects",
        type: "objectgroup",
        objects: (objects(map) as Obj[]).filter(
          (object) => object.type !== "save_point"
        ),
      };

      expect(validateMap(map).warnings).toEqual(["there is no save point"]);
    });
  });

  describe("the doors", () => {
    it("reports a door with a target which does not exist", () => {
      const map = goodMap();
      objects(map)[5].properties = [
        { name: "target", type: "object", value: 999 },
      ];

      expect(validateMap(map).errors[0]).toContain("has no valid");
    });

    it("reports a door which leads outside the rooms", () => {
      const map = goodMap();
      objects(map)[4].y = 9000;

      expect(validateMap(map).errors).toEqual([
        "the door 6 leads to 400, 9000, which is not inside a room",
      ]);
    });

    it("lets a door lead to another map, which it can not check", () => {
      const map = goodMap();
      objects(map)[5].properties = [
        { name: "target", type: "string", value: "cave_entrance" },
        { name: "targetMap", type: "string", value: "cave" },
      ];

      expect(validateMap(map)).toEqual({ errors: [], warnings: [] });
    });
  });
});

// What the validation asks of a map is what the scene really uses
import mainScene from "@/scenes/MainScene.ts?raw";
import { REQUIRED_TILESETS, REQUIRED_TILE_LAYERS } from "@/config/maps";

describe("the requirements of a map", () => {
  it("are the tile layers MainScene creates", () => {
    for (const name of REQUIRED_TILE_LAYERS) {
      expect(mainScene, name).toContain(`createLayer("${name}"`);
    }

    const created = [...mainScene.matchAll(/createLayer\("([a-z_]+)"/g)]
      .map((match) => match[1])
      // the slopes are optional
      .filter((name) => name !== "slopes");

    expect(created.sort()).toEqual([...REQUIRED_TILE_LAYERS].sort());
  });

  it("are the tilesets MainScene uses", () => {
    for (const name of REQUIRED_TILESETS) {
      expect(mainScene, name).toMatch(
        new RegExp(`addTilesetImage\\(\\s*"${name}"`)
      );
    }
  });
});
