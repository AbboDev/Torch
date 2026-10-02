import { Weapon } from "@/entities/weapons/Weapon";
import { RifleBullet } from "@/entities/bullets/RifleBullet";

export class Rifle extends Weapon {
  protected rateOfFire = 128;

  protected isSingle = false;

  public classType = RifleBullet;

  public defaultKey = "rifle_bullet";
}
