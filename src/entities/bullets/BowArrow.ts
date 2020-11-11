import { TILE_SIZE } from 'Config/tiles';

import { Bullet } from 'Entities/Bullets/Bullet';

export class BowArrow extends Bullet {
  protected speed = TILE_SIZE * 12;

  protected allowGravity = true;

  public static preload(scene: Phaser.Scene): void {
    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: 16,
      frameHeight: 8
    };

    scene.load
      .spritesheet(
        'bow_arrow',
        '/assets/sprites/bow_arrow.png',
        spriteSize
      );
  }
}
