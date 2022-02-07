import { TILE_SIZE } from 'Config/tiles';

import { ControlScene } from 'Scenes/ControlScene';

import { Bullet } from 'Entities/Bullets/Bullet';

export class RifleBullet extends Bullet {
  protected allowGravity = false;

  protected hasLight = true;

  public constructor(
    public scene: ControlScene,
    x: number,
    y: number,
    sprite: string
  ) {
    super(scene, x, y, sprite);

    this.speed = TILE_SIZE * 8;
  }

  public static preload(scene: Phaser.Scene): void {
    super.preload(scene);

    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: 16,
      frameHeight: 8
    };

    scene.load
      .spritesheet(
        'rifle_bullet',
        '/assets/sprites/rifle_bullet.png',
        spriteSize
      );
  }
}
