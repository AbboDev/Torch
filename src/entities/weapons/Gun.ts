import { Weapon } from "@/entities/weapons/Weapon";
import { GunBullet } from "@/entities/bullets/GunBullet";

export class Gun extends Weapon {
  protected rateOfFire = 64;

  public classType = GunBullet;

  public defaultKey = "bullet";
}
