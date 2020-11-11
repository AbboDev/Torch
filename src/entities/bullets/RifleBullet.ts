import { Bullet } from 'Entities/Bullets/Bullet';

export class RifleBullet extends Bullet {
  protected speed = 128;

  protected allowGravity = false;

  public static preload(scene: Phaser.Scene): void {
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
