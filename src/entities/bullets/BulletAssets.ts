import * as Phaser from "phaser";

export class BulletAssets {
  /**
   * Load all the bullet sprites into the Phaser asset pipeline.
   *
   * This is detached from the bullet classes so that the entities only
   * contain logic, while asset loading lives in one place.
   */
  public static loadBulletAssets(scene: Phaser.Scene): void {
    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: 16,
      frameHeight: 8,
    };

    scene.load.spritesheet(
      "bow_arrow",
      "assets/sprites/bow_arrow.png",
      spriteSize
    );

    scene.load.spritesheet(
      "rifle_bullet",
      "assets/sprites/rifle_bullet.png",
      spriteSize
    );

    const smallSpriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: 4,
      frameHeight: 4,
    };

    scene.load.spritesheet(
      "bullet",
      "assets/sprites/bullet.png",
      smallSpriteSize
    );
  }

  /**
   * Register bullet animations.
   *
   * Bullets are single-frame sprites, so there are no animations to register
   * yet. Kept as a no-op for symmetry with the player assets and for future
   * extensions.
   */
  public static registerBulletAnimations(_scene: Phaser.Scene): void {
    // No animations to register for bullets — they are static sprites.
  }
}