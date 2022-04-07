import * as Phaser from 'phaser';
import { DataScene } from 'Scenes/DataScene';
import { TILE_SIZE } from 'Config/tiles';
import { Switch } from 'Miscellaneous';

export class ItemSwitch extends Phaser.GameObjects.Arc {
  private status: Switch;

  public constructor(
    scene: DataScene,
    x: number,
    y: number,
    public text: string,
    status: Switch = Switch.INDETERMINATE,
    radius: number = TILE_SIZE / 2,
    fillColor: number = 0x1a65ac,
    fillAlpha: number = 1,
    strokeWidth: number = 2,
    strokeColor: number = 0xffffff,
    strokeAlpha: number = 1
  ) {
    super(scene, x, y, radius, undefined, undefined, undefined, fillColor, fillAlpha);

    this.status = status;

    this
      .setStrokeStyle(strokeWidth, strokeColor, strokeAlpha)
      .setColor()
      .on('selected', this.selected.bind(this));

    this.scene.add.text(this.x + this.width, this.y, text).setOrigin(0, 0.5);
    this.scene.add.existing(this);
  }

  private selected(status?: Switch): void {
    if (status) {
      this.status = status;
    } else if (this.status === Switch.ENABLE) {
      this.status = Switch.DISABLE;
    } else if (this.status === Switch.DISABLE) {
      this.status = Switch.ENABLE;
    }

    this.setColor();
  }

  private setColor(): ItemSwitch {
    switch (this.status) {
      case Switch.ENABLE:
        this.setFillStyle(0x00ff00);
        break;
      case Switch.DISABLE:
        this.setFillStyle(0x1a65ac);
        break;
      case Switch.INDETERMINATE:
      default:
        this.setFillStyle(0xdddddd);
        break;
    }

    return this;
  }
}
