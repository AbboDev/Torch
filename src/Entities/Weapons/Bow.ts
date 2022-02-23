import { Weapon } from 'Entities/Weapons/Weapon';

import { BowArrow } from 'Entities/Bullets/BowArrow';

export class Bow extends Weapon {
  protected rateOfFire = 256;

  protected isSingle = true;

  public classType = BowArrow;

  public defaultKey = 'bow_arrow';
}
