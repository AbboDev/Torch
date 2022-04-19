import { Weapon } from 'Entities/Weapons';
import { GunBullet } from 'Entities/Bullets';

export class Gun extends Weapon {
  protected rateOfFire = 64;

  public classType = GunBullet;

  public defaultKey = 'bullet';
}
