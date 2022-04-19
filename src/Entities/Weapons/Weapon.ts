import * as Phaser from 'phaser';
import { Bullet, BulletConfig } from 'Entities/Bullets';
import { MapScene } from 'Scenes';
import { GroupCollidable } from 'Entities/Collidables';

export class Weapon extends GroupCollidable {
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
    super(scene, {
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

  protected postChildCollision(
    child: unknown,
    object: unknown
  ): void {
    const bullet: Bullet = child as Bullet;
    const tile: Phaser.Tilemaps.Tile = object as Phaser.Tilemaps.Tile;

    bullet.impact(tile);
  }

  protected testChildCollision(
    child: Phaser.GameObjects.GameObject,
    object: unknown
  ): boolean {
    const tile: Phaser.Tilemaps.Tile = object as Phaser.Tilemaps.Tile;

    switch (tile.layer.name) {
      case 'stairs':
      case 'platforms':
        return false;
      default:
        break;
    }

    return tile.index >= 0;
  }
}
