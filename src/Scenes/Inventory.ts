import * as Phaser from 'phaser';
import { ControllerKey } from 'Miscellaneous';
import { ItemSwitch } from 'HUD/ItemSwitch';
import { DataScene } from 'Scenes';
import { TILE_SIZE } from 'Config/tiles';

export class Inventory extends DataScene {
  private cursor!: Phaser.GameObjects.Triangle;

  private buttons: Phaser.GameObjects.Arc[] = [];

  private selectedButtonIndex = 0;

  private mainScene!: Phaser.Scene;

  public constructor() {
    super({
      active: false,
      visible: false,
      key: 'inventory'
    });
  }

  public create(): void {
    super.create();

    const { width } = this.scale;

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${TILE_SIZE}px`
    };

    this.add.text(
      width / 2,
      TILE_SIZE / 2,
      'inventory',
      style
    )
      .setAlign('center')
      .setOrigin(0.5);

    this.cursor = this.add.triangle(
      TILE_SIZE,
      TILE_SIZE * 2,
      0,
      0,
      0,
      TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE / 2,
      0x6666ff
    )
      .setOrigin(0, 0.5)
      .setStrokeStyle(2, 0xffffff);

    this.tweens.addCounter({
      from: 50,
      to: 100,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const value = Math.floor(tween.getValue());

        this.cursor.setFillStyle(Phaser.Display.Color.GetColor(0, value, value));
      }
    });

    const gunButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      TILE_SIZE * 2,
      'TORCH GUN',
      TILE_SIZE / 2
    );

    const rifleButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      gunButton.y + TILE_SIZE * 1.5,
      'TORCH RIFLE',
      TILE_SIZE / 2
    );

    const bowButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      rifleButton.y + TILE_SIZE * 1.5,
      'TORCH BOW',
      TILE_SIZE / 2
    );

    const torchButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      bowButton.y + TILE_SIZE * 1.5,
      'TORCH LIGHT',
      TILE_SIZE / 2
    );

    const doubleJumpButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      torchButton.y + TILE_SIZE * 1.5,
      'DOUBLE JUMP',
      TILE_SIZE / 2
    );

    const highJumpButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      doubleJumpButton.y + TILE_SIZE * 1.5,
      'HIGH JUMP',
      TILE_SIZE / 2
    );

    const wallJumpButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      highJumpButton.y + TILE_SIZE * 1.5,
      'WALL JUMP',
      TILE_SIZE / 2
    );

    const boostedRunButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      wallJumpButton.y + TILE_SIZE * 1.5,
      'BOOSTED RUN',
      TILE_SIZE / 2
    );

    const swimButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      boostedRunButton.y + TILE_SIZE * 1.5,
      'SWIM',
      TILE_SIZE / 2
    );

    const hangButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      swimButton.y + TILE_SIZE * 1.5,
      'HANG',
      TILE_SIZE / 2
    );

    const dashButton = new ItemSwitch(
      this,
      TILE_SIZE * 3,
      hangButton.y + TILE_SIZE * 1.5,
      'DASH',
      TILE_SIZE / 2
    );

    this.buttons.push(gunButton);
    this.buttons.push(rifleButton);
    this.buttons.push(bowButton);

    this.buttons.push(torchButton);
    this.buttons.push(doubleJumpButton);
    this.buttons.push(highJumpButton);
    this.buttons.push(wallJumpButton);
    this.buttons.push(boostedRunButton);
    this.buttons.push(swimButton);
    this.buttons.push(hangButton);
    this.buttons.push(dashButton);

    this.selectButton(this.selectedButtonIndex);

    this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.75)');
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    const isStartPressed: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.START);

    if (isStartPressed) {
      this.scene.resume('main').sleep();
    }

    const isUpPress: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.UP);

    const isDownPress: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.DOWN);

    const isAPress: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.A);

    if (isUpPress) {
      this.selectNextButton(-1);
    } else if (isDownPress) {
      this.selectNextButton(1);
    } else if (isAPress) {
      this.confirmSelection();
    }
  }

  protected updateData(
    parent: Phaser.Game,
    key: string,
    data: string | number
  ): void {
    switch (key) {
      case 'ammo':
      case 'maxAmmo':
      case 'life':
      case 'maxLife':
      case 'battery':
      case 'maxBattery':
        break;
      default:
        console.debug(key, data.toString());
        break;
    }
  }

  private selectNextButton(change = 1): void {
    let index = this.selectedButtonIndex + change;

    // wrap the index to the front or end of array
    if (index >= this.buttons.length) {
      index = 0;
    } else if (index < 0) {
      index = this.buttons.length - 1;
    }

    this.selectButton(index);
  }

  private selectButton(index: number): void {
    const currentButton = this.buttons[this.selectedButtonIndex];

    // // set the current selected button to a white tint
    currentButton.setStrokeStyle(currentButton.lineWidth, 0xffffff);

    const button: Phaser.GameObjects.Arc = this.buttons[index];

    // set the newly selected button to a green tint
    button.setStrokeStyle(button.lineWidth, 0xefc53f);

    // move the hand cursor to the right edge
    this.cursor.x = button.x - TILE_SIZE * 2;
    this.cursor.y = button.y;

    // store the new selected index
    this.selectedButtonIndex = index;
  }

  private confirmSelection(): void {
    // get the currently selected button
    const button = this.buttons[this.selectedButtonIndex];

    // emit the 'selected' event
    button.emit('selected', button);
  }
}
