import * as Phaser from 'phaser';
import {
  ControllerKey,
  PowerUps,
  Switch
} from 'Miscellaneous';
import { ItemSwitch } from 'HUD/ItemSwitch';
import { DataScene } from 'Scenes';
import { TILE_SIZE } from 'Config/tiles';
import * as Weapons from 'Entities/Weapons';

type InventoryButton = [PowerUps/*  | Weapons.WeaponType */, ItemSwitch];

export class InventoryScene extends DataScene {
  private cursor!: Phaser.GameObjects.Triangle;

  private buttons: InventoryButton[] = [];

  private selectedButtonIndex = 0;

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

    let previousY: number = TILE_SIZE * 2;
    for (const [powerUp, key] of Object.entries(PowerUps)) {
      const button = new ItemSwitch(
        this,
        TILE_SIZE * 3,
        previousY,
        powerUp,
        this.getInventory().get(key)
      );

      this.buttons.push([key, button]);
      previousY = button.y + TILE_SIZE * 1.5;
    }

    // console.debug(Weapons);
    // previousY = TILE_SIZE * 2;
    // for (const [weapon, key] of Object.entries(Weapons)) {
    //   const button = new ItemSwitch(
    //     this,
    //     TILE_SIZE * 12,
    //     previousY,
    //     weapon,
    //     this.getInventory().get(key)
    //   );

    //   this.buttons.push([key, button]);
    //   previousY = button.y + TILE_SIZE * 1.5;
    // }

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
        // console.debug(key, data.toString());
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
    const currentTuple: InventoryButton = this.buttons[this.selectedButtonIndex];

    if (currentTuple.length !== 2) {
      throw new Error('Invalid tuple');
    }

    const button: ItemSwitch = currentTuple[1];

    // set the current selected button to a white tint
    button.setStrokeStyle(button.lineWidth, 0xffffff);

    const nextTuple: InventoryButton = this.buttons[index];

    if (nextTuple.length !== 2) {
      throw new Error('Invalid tuple');
    }

    const nextButton: ItemSwitch = nextTuple[1];

    // set the newly selected button to a green tint
    nextButton.setStrokeStyle(button.lineWidth, 0xefc53f);

    // move the hand cursor to the right edge
    this.cursor.x = nextButton.x - TILE_SIZE * 2;
    this.cursor.y = nextButton.y;

    // store the new selected index
    this.selectedButtonIndex = index;
  }

  private confirmSelection(): void {
    // get the currently selected button
    const tuple: InventoryButton = this.buttons[this.selectedButtonIndex];

    if (tuple.length !== 2) {
      throw new Error('Invalid tuple');
    }

    const item: PowerUps = tuple[0];
    const inventory = this.getInventory();

    if (inventory.has(item)) {
      const status: Switch = inventory.invertStatus(item);

      // emit the 'selected' event
      tuple[1].emit('selected', status);
    }
  }
}
