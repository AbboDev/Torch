import { describe, expect, it, vi } from "vitest";
import type * as Phaser from "phaser";
import { RoomBackground } from "@/world/RoomBackground";

vi.mock("phaser", () => ({}));

class FakeObject {
  public alpha = 1;
  public depth = 0;
  public destroyed = false;
  public scrollFactor: number[] = [];

  public constructor(
    public kind: string,
    public texture: string
  ) {}

  public setLighting(): this {
    return this;
  }

  public setScrollFactor(x: number, y = x): this {
    this.scrollFactor = [x, y];

    return this;
  }

  public setOrigin(): this {
    return this;
  }

  public setDepth(depth: number): this {
    this.depth = depth;

    return this;
  }

  public setAlpha(alpha: number): this {
    this.alpha = alpha;

    return this;
  }

  public destroy(): void {
    this.destroyed = true;
  }
}

function setup(loaded = true) {
  const objects: FakeObject[] = [];
  const tweens: { config: any; stopped: boolean }[] = [];

  const scene = {
    scale: { width: 640, height: 352 },
    textures: {
      exists: () => loaded,
      get: () => ({ getSourceImage: () => ({ height: 200 }) }),
    },
    add: {
      image: (_x: number, _y: number, texture: string) => {
        const object = new FakeObject("image", texture);
        objects.push(object);

        return object;
      },
      tileSprite: (
        _x: number,
        _y: number,
        _w: number,
        _h: number,
        texture: string
      ) => {
        const object = new FakeObject("tile", texture);
        objects.push(object);

        return object;
      },
    },
    tweens: {
      add: (config: any) => {
        const tween = {
          config,
          stopped: false,
          stop: () => (tween.stopped = true),
        };
        tweens.push(tween);

        return tween;
      },
    },
  } as unknown as Phaser.Scene;

  return { background: new RoomBackground(scene), objects, tweens };
}

describe("RoomBackground", () => {
  it("creates the layers of the background", () => {
    const { background, objects } = setup();

    background.show("laboratory", 1280);

    expect(objects.map((object) => [object.kind, object.texture])).toEqual([
      ["image", "laboratory-back"],
      ["tile", "laboratory-middle"],
      ["tile", "laboratory-front"],
    ]);
    expect(objects[1].scrollFactor).toEqual([1 / 3, 0]);
  });

  it("keeps the previous background in a room which has none", () => {
    const { background, objects } = setup();

    background.show("laboratory", 1280);
    background.show(undefined, 1280);

    expect(objects.every((object) => !object.destroyed)).toBe(true);
  });

  it("does not rebuild the same background for the same width", () => {
    const { background, objects } = setup();

    background.show("laboratory", 1280);
    background.show("laboratory", 1280);

    expect(objects).toHaveLength(3);
  });

  it("rebuilds it when the room has a different width", () => {
    const { background, objects } = setup();

    background.show("laboratory", 1280);
    background.show("laboratory", 448);

    expect(objects).toHaveLength(6);
    expect(objects.slice(0, 3).every((object) => object.destroyed)).toBe(true);
  });

  it("replaces the layers at once when no fade is asked", () => {
    const { background, objects } = setup();

    background.show("laboratory", 1280);
    background.show("mountains", 1280);

    expect(objects.slice(0, 3).every((object) => object.destroyed)).toBe(true);
    expect(objects.slice(3).every((object) => !object.destroyed)).toBe(true);
  });

  it("cross-fades: the new layers fade in above the old ones, which go at the end", () => {
    const { background, objects, tweens } = setup();

    background.show("laboratory", 1280);
    background.show("mountains", 1280, 500);

    const fresh = objects.slice(3);
    expect(fresh.every((object) => object.alpha === 0)).toBe(true);
    expect(objects.slice(0, 3).every((object) => !object.destroyed)).toBe(true);
    // above the old layers while fading
    expect(Math.min(...fresh.map((object) => object.depth))).toBeGreaterThan(
      Math.max(...objects.slice(0, 3).map((object) => object.depth)) - 3
    );

    tweens[0].config.onComplete();

    expect(objects.slice(0, 3).every((object) => object.destroyed)).toBe(true);
    expect(fresh.every((object) => object.alpha === 1)).toBe(true);
    // back to the normal depth
    expect(fresh.map((object) => object.depth)).toEqual([-6, -5, -4, -3, -2]);
  });

  it("finishes a cross-fade still running when another one starts", () => {
    const { background, objects, tweens } = setup();

    background.show("laboratory", 1280);
    background.show("mountains", 1280, 500);
    background.show("laboratory", 1280, 500);

    expect(tweens[0].stopped).toBe(true);
    // the laboratory layers of the first call are gone, the mountains are
    // complete and fading out behind the new laboratory
    expect(objects.slice(0, 3).every((object) => object.destroyed)).toBe(true);
    expect(objects.slice(3, 8).every((object) => object.alpha === 1)).toBe(
      true
    );
    expect(objects.slice(8).every((object) => object.alpha === 0)).toBe(true);
  });

  it("does nothing and warns for an unknown background", () => {
    const { background, objects } = setup();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    background.show("cave", 1280);

    expect(objects).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
  });

  it("does nothing and warns when the textures are not loaded", () => {
    const { background, objects } = setup(false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    background.show("laboratory", 1280);

    expect(objects).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
  });
});
