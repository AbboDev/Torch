import { ControllerKey } from 'Miscellaneous/Controller';
import { ControlScene } from 'Scenes/ControlScene';
import { TILE_SIZE } from 'Config/tiles';

export class Inventory extends ControlScene {
  private mainScene!: Phaser.Scene;

  public constructor() {
    super({
      active: false,
      visible: false,
      key: 'inventory',
    });
  }

  public create(): void {
    super.create();

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${TILE_SIZE * 3}px`
    };

    this.add.text(
      this.game.scale.width / 2,
      this.game.scale.width / 2,
      'inventory',
      style
    )
      .setAlign('center')
      .setOrigin(0.5);

    this.cameras.main.setBackgroundColor('#000000');
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    const isStartPressed: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.START);

    if (isStartPressed) {
      this.scene.resume('main');
      this.scene.stop();
    }
  }
}
