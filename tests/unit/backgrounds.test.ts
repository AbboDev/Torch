import { describe, expect, it } from "vitest";
import preloader from "@/scenes/PreloaderScene.ts?raw";
import { BACKGROUNDS } from "@/config/backgrounds";
import { getBackgroundLayers } from "@/world/backgrounds";
import { getRoomProperty } from "@/world/rooms";

describe("getBackgroundLayers", () => {
  it("makes the first layer a fixed image and the others scrolling tiles", () => {
    const layers = getBackgroundLayers("mountains")!;

    expect(layers.map((layer) => layer.kind)).toEqual([
      "image",
      "tile",
      "tile",
      "tile",
      "tile",
    ]);
    expect(layers[0].scrollFactor).toBe(0);
  });

  it("scrolls the layers faster the nearer they are, like the old code did", () => {
    // layer / number of layers
    const factors = getBackgroundLayers("mountains")!.map(
      (layer) => layer.scrollFactor
    );

    expect(factors).toEqual([0, 1 / 5, 2 / 5, 3 / 5, 4 / 5]);
    expect(
      getBackgroundLayers("laboratory")!.map((layer) => layer.scrollFactor)
    ).toEqual([0, 1 / 3, 2 / 3]);
  });

  it("draws the farthest layer below the others, just under the world", () => {
    const offsets = getBackgroundLayers("laboratory")!.map(
      (layer) => layer.depthOffset
    );

    expect(offsets).toEqual([-3, -2, -1]);
  });

  it("allows a layer to choose its own scroll factor", () => {
    const table = {
      test: [{ texture: "a" }, { texture: "b", scrollFactor: 0.9 }],
    };

    expect(getBackgroundLayers("test", table)![1].scrollFactor).toBe(0.9);
  });

  it("returns null for an unknown name, even one which is a property of Object", () => {
    expect(getBackgroundLayers("cave")).toBeNull();
    expect(getBackgroundLayers("lab")).toBeNull();
    expect(getBackgroundLayers("toString")).toBeNull();
    expect(getBackgroundLayers("constructor")).toBeNull();
  });
});

describe("the backgrounds table", () => {
  it("only uses textures which the PreloaderScene loads", () => {
    for (const [name, layers] of Object.entries(BACKGROUNDS)) {
      for (const { texture } of layers) {
        expect(
          preloader.includes(`.image("${texture}"`),
          `${name}: texture "${texture}" is not loaded`
        ).toBe(true);
      }
    }
  });
});

describe("getRoomProperty", () => {
  const room = {
    properties: [
      { name: "background", value: "laboratory" },
      { name: "dark", value: "000000" },
    ],
  };

  it("reads the property of a room", () => {
    expect(getRoomProperty(room, "background")).toBe("laboratory");
  });

  it("is undefined when there is none", () => {
    expect(getRoomProperty(room, "music")).toBeUndefined();
    expect(getRoomProperty({}, "background")).toBeUndefined();
  });
});
