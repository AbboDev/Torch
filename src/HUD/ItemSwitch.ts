import * as Phaser from 'phaser';
import { DataScene } from 'Scenes/DataScene';
import { TILE_SIZE } from 'Config/tiles';

export class ItemSwitch extends Phaser.GameObjects.Arc {
  private status = false;

  public constructor(
    scene: DataScene,
    x: number,
    y: number,
    public text: string,
    radius: number = TILE_SIZE / 2,
    fillColor = 0x1a65ac,
    fillAlpha = 1,
    strokeWidth = 2,
    strokeColor = 0xffffff,
    strokeAlpha = 1,
    startAngle: number | undefined = undefined,
    endAngle: number | undefined = undefined,
    anticlockwise: boolean | undefined = undefined
  ) {
    super(scene, x, y, radius, startAngle, endAngle, anticlockwise, fillColor, fillAlpha);

    this.setStrokeStyle(strokeWidth, strokeColor, strokeAlpha);
    this.on('selected', this.selected.bind(this));

    this.scene.add.text(this.x + this.width, this.y, text).setOrigin(0, 0.5);
    this.scene.add.existing(this);
  }

  private selected(): void {
    this.status = !this.status;

    this.setFillStyle(this.status ? 0x00ff00 : 0x1a65ac);
    console.log(this.text, this.status);
  }
}
