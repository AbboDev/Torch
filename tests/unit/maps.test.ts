import { describe, expect, it } from "vitest";
import { validateMap } from "@/world/mapValidation";

// Every map of the game, whatever the area: a mistake in Tiled shows up here.
// What is probably wrong but works (no save point, two rooms with the same
// name) is printed; to make it fail run the tests with VITE_STRICT_MAPS=1.
const maps = import.meta.glob("../../assets/maps/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const strict = !!import.meta.env.VITE_STRICT_MAPS;

describe("the maps of the game", () => {
  it("are there", () => {
    expect(Object.keys(maps).length).toBeGreaterThan(0);
  });

  for (const [path, source] of Object.entries(maps)) {
    const name = path.split("/").pop();

    describe(name as string, () => {
      const { errors, warnings } = validateMap(JSON.parse(source));

      it("has nothing which stops the game", () => {
        expect(errors).toEqual([]);
      });

      it("has nothing which is probably a mistake", () => {
        if (warnings.length > 0) {
          console.warn(`${name}:\n - ${warnings.join("\n - ")}`);
        }

        if (strict) {
          expect(warnings).toEqual([]);
        }
      });
    });
  }
});

describe("chozodia and its mirror", () => {
  const source = (fileName: string) => {
    const found = Object.entries(maps).find(([path]) =>
      path.endsWith(`/${fileName}`)
    );

    if (!found) {
      throw new Error(`missing ${fileName}`);
    }

    return JSON.parse(found[1]) as {
      width: number;
      layers: {
        name: string;
        width?: number;
        data?: number[];
        objects?: {
          name?: string;
          properties?: { name: string; value: string }[];
        }[];
      }[];
    };
  };

  const objects = (map: ReturnType<typeof source>) =>
    map.layers.find((layer) => layer.name === "objects")?.objects ?? [];

  const property = (
    object: { properties?: { name: string; value: string }[] },
    name: string
  ) => object.properties?.find((property) => property.name === name)?.value;

  it("meet through a passage in room_left", () => {
    const chozodia = source("chozodia.json");
    const mirror = source("chozodia_mirror.json");
    const passage = objects(chozodia).find(
      (object) => object.name === "to_mirror"
    );
    const back = objects(mirror).find(
      (object) => object.name === "to_chozodia"
    );

    expect(property(passage ?? {}, "targetMap")).toBe("chozodia_mirror");
    expect(property(passage ?? {}, "target")).toBe("from_chozodia");
    expect(property(back ?? {}, "targetMap")).toBe("chozodia");
    expect(property(back ?? {}, "target")).toBe("from_mirror");
    expect(
      objects(mirror).some((object) => object.name === "from_chozodia")
    ).toBe(true);
    expect(
      objects(chozodia).some((object) => object.name === "from_mirror")
    ).toBe(true);

    // Left column of room_left; the mirror puts that opening on the right edge
    const rows = [15, 16, 17, 18];
    const column = (map: ReturnType<typeof source>, x: number) => {
      const layer = map.layers.find(
        (candidate) => candidate.name === "collision"
      );
      const width = layer?.width ?? 0;

      return rows.map((row) => layer?.data?.[row * width + x]);
    };

    expect(column(chozodia, 0)).toEqual([0, 0, 0, 0]);
    expect(column(mirror, chozodia.width - 1)).toEqual([0, 0, 0, 0]);
  });
});
