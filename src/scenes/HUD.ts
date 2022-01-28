import { ControlScene } from 'Scenes/ControlScene';
import { TILE_SIZE } from 'Config/tiles';

export class HUD extends ControlScene {
  private life!: Phaser.GameObjects.Image;
  private lifeCounter!: Phaser.GameObjects.Text;

  private battery!: Phaser.GameObjects.Image;
  private batteryCounter!: Phaser.GameObjects.Text;

  private ammo!: Phaser.GameObjects.Image;
  private ammoCounter!: Phaser.GameObjects.Text;

  constructor() {
    super({
      active: false,
      visible: false,
      key: 'hud',
    });
  }

  create(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${TILE_SIZE}px`
    };

    let offset: number = TILE_SIZE * 0.5;

    this.life = this.add.image(offset, TILE_SIZE * 0.5, 'life')
      .setSize(TILE_SIZE, TILE_SIZE)
      .setScale(0.5)
      .setOrigin(0);

    offset += TILE_SIZE * 1.5;

    this.lifeCounter = this.add.text(offset, TILE_SIZE * 0.5, '99', style)
      .setAlign('center')
      .setOrigin(0);

    offset += TILE_SIZE * 2;

    this.battery = this.add.image(offset, TILE_SIZE * 0.5, 'battery')
      .setSize(TILE_SIZE, TILE_SIZE)
      .setScale(0.5)
      .setOrigin(0);

    offset += TILE_SIZE * 1.5;

    this.batteryCounter = this.add.text(offset, TILE_SIZE * 0.5, '99', style)
      .setAlign('center')
      .setOrigin(0);

    this.ammo = this.add.image(
      (this.game.scale.width) - TILE_SIZE * 6,
      TILE_SIZE * 0.5,
      'ammo'
    )
      .setSize(TILE_SIZE, TILE_SIZE)
      .setScale(0.5)
      .setOrigin(1, 0);

    this.ammoCounter = this.add.text(
      (this.game.scale.width) - TILE_SIZE,
      TILE_SIZE * 0.5,
      '99 / 99',
      style
    )
      .setAlign('right')
      .setOrigin(1, 0);
  }

  update(): void {
    // this.lifeCounter.setText('99');
    // this.batteryCounter.setText('99');
    // this.ammoCounter.setText('99 / 99');
  }
}
