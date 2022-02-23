import { Weapon } from 'Entities/Weapons/Weapon';

import { RifleBullet } from 'Entities/Bullets/RifleBullet';

export class Rifle extends Weapon {
  protected rateOfFire = 128;

  protected isSingle = false;

  public classType = RifleBullet;

  public defaultKey = 'rifle_bullet';
}
