import { Weapon } from 'Entities/Weapons';
import { RifleBullet } from 'Entities/Bullets';

export class Rifle extends Weapon {
  protected rateOfFire = 128;

  protected isSingle = false;

  public classType = RifleBullet;

  public defaultKey = 'rifle_bullet';
}
