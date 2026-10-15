import { MapScene } from "@/scenes/MapScene";
import { Bullet } from "@/entities/bullets/Bullet";
import { TILE_SIZE } from "@/config/tiles";

export class BowArrow extends Bullet {
  protected allowGravity = true;

  protected hasLight = true;

  public constructor(
    public scene: MapScene,
    x: number,
    y: number,
    sprite: string
  ) {
    super(scene, x, y, sprite);

    this.speed = TILE_SIZE * 12;
  }
}
