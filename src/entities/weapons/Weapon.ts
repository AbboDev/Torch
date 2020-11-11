import { Facing } from 'Miscellaneous/Direction';
import { Bullet, BulletConfig } from 'Entities/Bullets/Bullet';

import { ControlScene } from 'Scenes/ControlScene';

export class Weapon extends Phaser.Physics.Arcade.Group {
  /**
   * The time when the last bullet had been shot
   * @type {Number}
   */
  private lastFired = 0;

  /**
   * The minimum time required t
   * @type {Number}
   */
  protected rateOfFire = 128;

  protected isSingle = true;

  protected hasAlreayShoot = false;

  public maxSize = 64;

  public classType = Bullet;

  public defaultKey = 'bullet';

  public constructor(
    public scene: ControlScene
  ) {
    super(
      scene.physics.world,
      scene,
      {
        runChildUpdate: true,
        classType: Bullet
      }
    );

    this.scene.add.existing(this);
  }

  public fireBullet(time: any, config: BulletConfig) {
    let canShoot = time > this.lastFired
      && (!this.isSingle
        || !this.hasAlreayShoot);

    if (canShoot) {
      let bullet = this.get();

      if (bullet) {
        bullet.fire(config);
        this.lastFired = time + this.rateOfFire;
      }
    }

    if (this.isSingle) {
      this.hasAlreayShoot = true;
    }
  }

  public canShoot() {
    this.hasAlreayShoot = false;
  }
}
