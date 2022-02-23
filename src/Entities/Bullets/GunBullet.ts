import { TILE_SIZE } from 'Config/tiles';

import { MapScene } from 'Scenes/MapScene';

import { Bullet } from 'Entities/Bullets/Bullet';

export class GunBullet extends Bullet {
  protected allowGravity = false;

  protected hasLight = true;

  public constructor(
    public scene: MapScene,
    x: number,
    y: number,
    sprite: string
  ) {
    super(scene, x, y, sprite);

    this.speed = TILE_SIZE * 4;
  }

  public static preload(scene: Phaser.Scene): void {
    super.preload(scene);

    const spriteSize: Phaser.Types.Loader.FileTypes.ImageFrameConfig = {
      frameWidth: 4,
      frameHeight: 4
    };

    scene.load
      .spritesheet(
        'bullet',
        '/assets/sprites/bullet.png',
        spriteSize
      );
  }
}
