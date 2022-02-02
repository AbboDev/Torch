import { Liquid } from 'Entities/Liquids/Liquid';
import { MapScene } from 'Scenes/MapScene';

import { TILE_SIZE } from 'Config/tiles';

export class Acid extends Liquid {
  public name = 'acid';

  protected static FRAME_WIDTH = TILE_SIZE * 16.5;
  protected static FRAME_HEIGHT = TILE_SIZE * 16;

  public constructor(
    public scene: MapScene,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    super(scene, x, y, width, height, 'acid');
  }
}
