import { Facing } from 'Miscellaneous/Direction';
import { Bullet } from 'Entities/Bullet';

import { ControlScene } from 'Scenes/ControlScene';

export class Bullets extends Phaser.Physics.Arcade.Group {
  private lastFired = 0;
  private rateOfFire = 0;

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

  fireBullet(time: any, facing: Facing, x: number | Phaser.Math.Vector2, y?: number) {
    if (time > this.lastFired) {
      if (x instanceof Phaser.Math.Vector2) {
        y = x.y;
        x = x;
      }

      let bullet = this.get();

      if (bullet) {
        bullet.fire(facing, x, y);
        this.lastFired = time + this.rateOfFire;
      }
    }
  }
}
