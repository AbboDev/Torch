import { Facing } from 'Miscellaneous/Direction';
import { Bullet, BulletConfig } from 'Entities/Bullets/Bullet';

import { ControlScene } from 'Scenes/ControlScene';

export class Weapon extends Phaser.Physics.Arcade.Group {
  private lastFired = 0;

  protected rateOfFire = 0;

  protected isSingle = false;

  protected hasAlreayShoot = false;

  public constructor(
    public scene: ControlScene,
    rateOfFire?: number,
    maxSize?: number
  ) {
    super(
      scene.physics.world,
      scene,
      {
        maxSize: maxSize || 64,
        runChildUpdate: true,
        classType: Bullet
      }
    );

    this.rateOfFire = rateOfFire || 128;

    this.scene.add.existing(this);
  }

  fireBullet(time: any, config: BulletConfig) {
    if (time > this.lastFired) {
      let bullet = this.get();

      if (bullet) {
        bullet.fire(config);
        this.lastFired = time + this.rateOfFire;
      }
    }
  }
}
