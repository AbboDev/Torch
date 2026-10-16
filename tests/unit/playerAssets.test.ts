import { describe, expect, it, vi } from "vitest";
import {
  PlayerAssets,
  getPlayerAssetSteps,
} from "@/entities/player/PlayerAssets";
import { legacyCreate } from "../helpers/legacyPlayerAssets";

vi.mock("phaser", () => ({}));

/** A scene which writes down what it is asked, in order */
function recordingScene() {
  const calls: unknown[][] = [];

  const scene = {
    load: {
      atlas: (...args: unknown[]) => calls.push(["load.atlas", ...args]),
    },
    textures: {
      addSpriteSheetFromAtlas: (key: string, config: unknown) =>
        calls.push(["textures.addSpriteSheetFromAtlas", key, config]),
    },
    anims: {
      generateFrameNumbers: (key: string, config: unknown) => {
        calls.push(["anims.generateFrameNumbers", key, config]);

        return `frames of ${key} ${JSON.stringify(config)}`;
      },
      create: (config: unknown) => calls.push(["anims.create", config]),
    },
  };

  return { scene: scene as never, calls };
}

describe("PlayerAssets", () => {
  it("keeps the previous asset setup outside the improved hang animations", () => {
    const before = recordingScene();
    const after = recordingScene();

    legacyCreate(before.scene);
    PlayerAssets.create(after.scene);

    const withoutHangAnimations = (calls: unknown[][]) =>
      calls.filter(
        ([name, config]) =>
          name !== "anims.create" ||
          !(config as { key: string }).key.startsWith("hero_hang_")
      );

    expect(withoutHangAnimations(after.calls)).toEqual(
      withoutHangAnimations(before.calls)
    );
    // and it was a lot: 20 sprite sheets and 22 animations
    expect(
      before.calls.filter(
        ([name]) => name === "textures.addSpriteSheetFromAtlas"
      )
    ).toHaveLength(20);
    expect(
      before.calls.filter(([name]) => name === "anims.create")
    ).toHaveLength(22);
  });

  it("keeps hanging subtle and reverses it smoothly", () => {
    const hangs = getPlayerAssetSteps().filter(
      (step) => step.type === "animation" && step.key.startsWith("hero_hang_")
    );

    expect(hangs).toHaveLength(2);
    expect(
      hangs.every(
        (step) =>
          step.type === "animation" &&
          step.frameRate === 5 &&
          step.repeat === -1 &&
          step.yoyo
      )
    ).toBe(true);
  });

  it("loads the atlas of the hero", () => {
    const { scene, calls } = recordingScene();

    PlayerAssets.preload(scene);

    expect(calls).toEqual([
      [
        "load.atlas",
        "hero",
        "assets/sprites/hero.png",
        "assets/sprites/hero.json",
      ],
    ]);
  });

  it("makes every animation from a sheet which is created before it", () => {
    const created = new Set<string>();

    for (const step of getPlayerAssetSteps()) {
      if (step.type === "sheet") {
        created.add(step.key);
      } else {
        expect(created.has(step.sheet), step.key).toBe(true);
      }
    }
  });

  it("has no two animations or sheets with the same key", () => {
    const keys = getPlayerAssetSteps().map(
      (step) => `${step.type}:${step.key}`
    );

    expect(new Set(keys).size).toBe(keys.length);
  });
});
