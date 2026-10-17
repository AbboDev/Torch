import { MapScene } from "@/scenes/MapScene";
import { Bullet } from "@/entities/bullets/Bullet";
import { TILE_SIZE } from "@/config/tiles";
import { WEAPON_DAMAGE } from "@/config/weapons";

export class GunBullet extends Bullet {
  public damage = WEAPON_DAMAGE.gun;

  protected allowGravity = false;

  protected hasLight = true;

  public constructor(
    public scene: MapScene,
    x: number,
    y: number,
    sprite: string
  ) {
    super(scene, x, y, sprite);

    this.speed = TILE_SIZE * 4;
  }
}
