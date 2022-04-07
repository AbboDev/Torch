import * as Phaser from 'phaser';
import { Bullet, BulletConfig } from 'Entities/Bullets/Bullet';
import { MapScene } from 'Scenes/MapScene';

export class Weapon extends Phaser.Physics.Arcade.Group {
  /**
   * The time when the last bullet had been shot
   *
   * @type {Number}
   */
  private lastFired: number = 0;

  /**
   * The minimum time required to shot another bullet
   *
   * @type {Number}
   */
  protected rateOfFire: number = 128;

  protected isSingle = true;

  protected hasAlreadyShoot = false;

  public maxSize = 64;

  public classType = Bullet;

  public defaultKey = 'bullet';

  public constructor(
    public scene: MapScene
  ) {
    super(scene.physics.world, scene, {
      runChildUpdate: true,
      classType: Bullet
    });

    this.scene.add.existing(this);
  }

  public fireBullet(time: any, config: BulletConfig): boolean {
    const canShoot = time > this.lastFired
      && (!this.isSingle
        || !this.hasAlreadyShoot);

    if (canShoot) {
      const bullet = this.get(config.position.x, config.position.y) as Bullet;

      if (bullet) {
        bullet.fire(config);
        this.lastFired = time as number + this.rateOfFire;
      }
    }

    if (this.isSingle) {
      this.hasAlreadyShoot = true;
    }

    return canShoot;
  }

  public canShoot(): void {
    this.hasAlreadyShoot = false;
  }
}
