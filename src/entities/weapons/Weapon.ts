import { Facing } from 'Miscellaneous/Direction';
import { Bullet, BulletConfig } from 'Entities/Bullets/Bullet';

import { GroupCollidable } from 'Entities/WorldCollidable';

import { MapScene } from 'Scenes/MapScene';

export class Weapon extends GroupCollidable {
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
    public scene: MapScene
  ) {
    super(scene, {
      runChildUpdate: true,
      classType: Bullet
    });

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

  protected postChildCollision(
    bullet: Bullet,
    tile: Phaser.GameObjects.GameObject
  ): void {
    bullet.impact();
  }
}
