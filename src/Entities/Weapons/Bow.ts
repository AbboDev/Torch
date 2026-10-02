import { Weapon } from "@/entities/weapons/Weapon";
import { BowArrow } from "@/entities/bullets/BowArrow";

export class Bow extends Weapon {
  protected rateOfFire = 256;

  protected isSingle = true;

  public classType = BowArrow;

  public defaultKey = "bow_arrow";
}
