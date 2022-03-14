import { Weapon } from 'Entities/Weapons/Weapon';
import { GunBullet } from 'Entities/Bullets/GunBullet';

export class Gun extends Weapon {
  protected rateOfFire = 64;

  public classType = GunBullet;

  public defaultKey = 'bullet';
}
