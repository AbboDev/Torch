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
