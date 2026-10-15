import * as Phaser from "phaser";
import { TILE_SIZE } from "@/config/tiles";

export class PlayerAssets {
  /**
   * Load the player's texture atlas into the Phaser asset pipeline.
   */
  public static loadPlayerAssets(scene: Phaser.Scene): void {
    scene.load.atlas(
      "hero",
      "assets/sprites/hero.png",
      "assets/sprites/hero.json"
    );
  }

  /**
   * Build the player's sprite sheets and animations from the atlas.
   */
  public static registerPlayerAnimations(scene: Phaser.Scene): void {
    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: TILE_SIZE * 2,
      frameHeight: TILE_SIZE * 3,
    };

    const idleAnimations = [
      "idle",
      "crouch_idle",
      "hang",
      "aim_up",
      "aim_up_diagonal",
      "aim_down_diagonal",
    ];
    for (let idleAnimation of idleAnimations) {
      const animations = [`${idleAnimation}_left`, `${idleAnimation}_right`];

      if (idleAnimation.indexOf("idle") !== -1) {
        animations.push(`${idleAnimation}_center`);
      }

      for (const animation of animations) {
        const key = `hero_${animation}`;
        scene.textures.addSpriteSheetFromAtlas(key, {
          atlas: "hero",
          frame: key,
          ...spriteSize,
        });

        scene.anims.create({
          key: `hero_${animation}_animation`,
          frames: scene.anims.generateFrameNumbers(key, {
            start: 0,
          }),
          frameRate: 4,
          repeat: -1,
        });
      }
    }

    const fastAnimations = ["walk", "jump"];
    for (let fastAnimation of fastAnimations) {
      const animations = [`${fastAnimation}_left`, `${fastAnimation}_right`];

      for (const animation of animations) {
        const key = `hero_${animation}`;
        scene.textures.addSpriteSheetFromAtlas(key, {
          atlas: "hero",
          frame: key,
          ...spriteSize,
        });

        scene.anims.create({
          key: `hero_${animation}_animation`,
          frames: scene.anims.generateFrameNumbers(key, {
            start: 0,
          }),
          frameRate: 20,
          repeat: -1,
        });
      }
    }

    const jumpAnimations = ["jump_idle", "fall_idle"];
    const textures = [
      `${jumpAnimations[0]}_left`,
      `${jumpAnimations[0]}_right`,
    ];
    for (const texture of textures) {
      const key = `hero_${texture}`;
      scene.textures.addSpriteSheetFromAtlas(key, {
        atlas: "hero",
        frame: key,
        ...spriteSize,
      });
    }

    for (let jumpAnimation of jumpAnimations) {
      const animations = [`${jumpAnimation}_left`, `${jumpAnimation}_right`];
      const isJump = jumpAnimation.indexOf("jump") !== -1;

      for (let index = 0; index < animations.length; index++) {
        const animation = animations[index];

        scene.anims.create({
          key: `hero_${animation}_animation`,
          frames: scene.anims.generateFrameNumbers(`hero_${textures[index]}`, {
            start: isJump ? 0 : 2,
            end: isJump ? 1 : 3,
          }),
          duration: 300,
        });
      }
    }
  }
}