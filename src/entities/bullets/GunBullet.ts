import { Bullet } from 'Entities/Bullets/Bullet';

export class GunBullet extends Bullet {
  protected speed = 64;

  protected allowGravity = false;

  public static preload(scene: Phaser.Scene): void {
  }
}
