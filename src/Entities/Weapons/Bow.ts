import { Weapon } from 'Entities/Weapons';
import { BowArrow } from 'Entities/Bullets';

export class Bow extends Weapon {
  protected rateOfFire = 256;

  protected isSingle = true;

  public classType = BowArrow;

  public defaultKey = 'bow_arrow';
}
