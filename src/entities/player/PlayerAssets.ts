import type * as Phaser from "phaser";
import { TILE_SIZE } from "@/config/tiles";

/** The size of a frame of the sprites of the Player */
const FRAME_SIZE = { frameWidth: TILE_SIZE * 2, frameHeight: TILE_SIZE * 3 };

type Side = "left" | "right" | "center";

/** A sprite sheet cut from the atlas of the hero */
interface SheetStep {
  type: "sheet";
  /** The key of the texture, which is also the frame of the atlas */
  key: string;
}

/** An animation made of the frames of a sprite sheet */
interface AnimationStep {
  type: "animation";
  key: string;
  /** The key of the texture it takes its frames from */
  sheet: string;
  frames: { start: number; end?: number };
  frameRate?: number;
  repeat?: number;
  duration?: number;
  yoyo?: boolean;
}

export type AssetStep = SheetStep | AnimationStep;

const withSides = (name: string, sides: Side[]) =>
  sides.map((side) => `${name}_${side}`);

/**
 * Everything to set up for the hero, in the order to do it: the sprite sheets
 * of the atlas and the animations, with the key of each (`hero_<name>` for the
 * sheet, `hero_<name>_animation` for the animation).
 */
export function getPlayerAssetSteps(): AssetStep[] {
  const steps: AssetStep[] = [];

  /** A sheet and an animation of the same name which loops */
  const looping = (name: string, frameRate: number, yoyo = false) => {
    const sheet = `hero_${name}`;

    steps.push({ type: "sheet", key: sheet });
    steps.push({
      type: "animation",
      key: `${sheet}_animation`,
      sheet,
      frames: { start: 0 },
      frameRate,
      repeat: -1,
      ...(yoyo && { yoyo: true }),
    });
  };

  // Poses: slow. Only the standing one looks at the front.
  const poses = [
    "idle",
    "crouch_idle",
    "hang",
    "aim_up",
    "aim_up_diagonal",
    "aim_down_diagonal",
  ];
  for (const pose of poses) {
    const sides: Side[] = pose.includes("idle")
      ? ["left", "right", "center"]
      : ["left", "right"];

    withSides(pose, sides).forEach((name) =>
      looping(name, pose === "hang" ? 5 : 4, pose === "hang")
    );
  }

  // Walking and the first moments of a jump: fast
  for (const movement of ["walk", "jump"]) {
    withSides(movement, ["left", "right"]).forEach((name) => looping(name, 20));
  }

  // In the air: two animations (the rise and the fall) share the sheet of the
  // rise, and each one takes two frames of it, once
  const airSheets = withSides("jump_idle", ["left", "right"]).map(
    (name) => `hero_${name}`
  );
  airSheets.forEach((key) => steps.push({ type: "sheet", key }));

  for (const name of ["jump_idle", "fall_idle"]) {
    const isRise = name.includes("jump");

    withSides(name, ["left", "right"]).forEach((animation, index) => {
      steps.push({
        type: "animation",
        key: `hero_${animation}_animation`,
        sheet: airSheets[index],
        frames: isRise ? { start: 0, end: 1 } : { start: 2, end: 3 },
        duration: 300,
      });
    });
  }

  return steps;
}

/** Load and set up the sprites and animations of the hero */
export class PlayerAssets {
  /** Load the atlas of the hero: call it in the preload of a scene */
  public static preload(scene: Phaser.Scene): void {
    scene.load.atlas(
      "hero",
      "assets/sprites/hero.png",
      "assets/sprites/hero.json"
    );
  }

  /**
   * Cut the sprite sheets from the atlas and create the animations. They
   * belong to the whole game: call it once, when everything is loaded.
   */
  public static create(scene: Phaser.Scene): void {
    for (const step of getPlayerAssetSteps()) {
      if (step.type === "sheet") {
        scene.textures.addSpriteSheetFromAtlas(step.key, {
          atlas: "hero",
          frame: step.key,
          ...FRAME_SIZE,
        });

        continue;
      }

      const { type, sheet, frames, ...animation } = step;

      scene.anims.create({
        ...animation,
        frames: scene.anims.generateFrameNumbers(sheet, frames),
      });
    }
  }
}
