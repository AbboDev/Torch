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

type InventoryButton = [PowerUps | Weapons.Weapon, ItemSwitch];

export class InventoryScene extends DataScene {
  private cursor!: Phaser.GameObjects.Triangle;

  private buttons: InventoryButton[][] = [];

  private selectedButtonIndex: [number, number] = [0, 0];

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

      if (!this.buttons[0]) {
        this.buttons[0] = [];
      }

      this.buttons[0].push([key, button]);
      previousY = button.y + TILE_SIZE * 1.5;
    }

    previousY = TILE_SIZE * 2;
    for (const [key, item] of Object.entries(Weapons)) {
      if (item === Weapons.Weapon) {
        continue;
      }

      const weapon: unknown = item as unknown;

      let value = Switch.INDETERMINATE;
      if (this.getInventory().carry(weapon as Weapons.Weapon)) {
        value = (this.getInventory().getCurrentWeapon() === weapon)
          ? Switch.ENABLE
          : Switch.DISABLE;
      }

      const button = new ItemSwitch(
        this,
        TILE_SIZE * 12,
        previousY,
        key,
        value
      );

      if (!this.buttons[1]) {
        this.buttons[1] = [];
      }

      this.buttons[1].push([weapon as Weapons.Weapon, button]);
      previousY = button.y + TILE_SIZE * 1.5;
    }

    this.selectButton(this.selectedButtonIndex);

    this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.75)');

    const gateway = this.scene.get('gateway');
    gateway.events
      .addListener('changedWeapon', (weapon: Weapons.Weapon) => {
        for (let index = 0; index < this.buttons[1].length; index++) {
          const button = this.buttons[1][index];
          const [key, itemSwitch] = button;

          // @ts-ignore
          const isActive: boolean = key === weapon.constructor;
          const status: Switch = (isActive) ? Switch.ENABLE : Switch.DISABLE;

          if (isActive) {
            this.selectButton([1, index]).confirmSelection();
          }

          itemSwitch.emit('selected', status);
        }
      });
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

    const isLeftPress: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.LEFT);

    const isRightPress: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.RIGHT);

    const isAPress: boolean = this.getController()
      .isKeyPressedForFirstTime(ControllerKey.A);

    if (isUpPress) {
      this.selectNextButton(0, -1);
    } else if (isDownPress) {
      this.selectNextButton(0, 1);
    } else if (isLeftPress) {
      this.selectNextButton(-1, 0);
    } else if (isRightPress) {
      this.selectNextButton(1, 0);
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

  private selectNextButton(horizontalMovement = 0, verticalMovement = 1): InventoryScene {
    const [horizontal, vertical]: [number, number] = this.selectedButtonIndex;

    let newVertical: number = vertical + verticalMovement;
    let newHorizontal: number = horizontal + horizontalMovement;

    // wrap the index to the front or end of array
    if (newHorizontal >= this.buttons.length) {
      newHorizontal = 0;
    } else if (newHorizontal < 0) {
      newHorizontal = this.buttons.length - 1;
    }

    if (newVertical >= this.buttons[newHorizontal].length) {
      newVertical = (newHorizontal === 0) ? 0 : this.buttons[newHorizontal].length - 1;
    } else if (newVertical < 0) {
      newVertical = this.buttons[newHorizontal].length - 1;
    }

    const movement: [number, number] = [newHorizontal, newVertical];

    return this.selectButton(movement);
  }

  private selectButton(index: [number, number]): InventoryScene {
    const [oldHorizontal, oldVertical]: [number, number] = this.selectedButtonIndex;
    const currentTuple: InventoryButton = this.buttons[oldHorizontal][oldVertical];

    if (currentTuple.length !== 2) {
      throw new Error('Invalid tuple');
    }

    const button: ItemSwitch = currentTuple[1];

    // set the current selected button to a white tint
    button.setStrokeStyle(button.lineWidth, 0xffffff);

    const [horizontal, vertical]: [number, number] = index;
    const nextTuple: InventoryButton = this.buttons[horizontal][vertical];

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

    return this;
  }

  private confirmSelection(): InventoryScene {
    const [horizontal, vertical]: [number, number] = this.selectedButtonIndex;
    // get the currently selected button
    const tuple: InventoryButton = this.buttons[horizontal][vertical];

    if (tuple.length !== 2) {
      throw new Error("Invalid tuple");
    }

    const item: PowerUps | Weapons.Weapon = tuple[0];
    const inventory = this.getInventory();

    console.debug(item);

    // @ts-ignore
    if (inventory.carry(item)) {
      console.debug(tuple[1]);
      console.debug(inventory.getCurrentWeapon());
      // @ts-ignore
      if (inventory.getCurrentWeapon() instanceof item) {
        return this;
      }

      inventory.switchCurrentWeapon(item as Weapons.Weapon);

      for (const button of this.buttons[horizontal]) {
        const [currentItem, currentButton] = button;

        let status: Switch = Switch.DISABLE;
        // @ts-ignore
        if (inventory.getCurrentWeapon() instanceof currentItem) {
          status = Switch.ENABLE;
        }

        currentButton.emit("selected", status);
      }
    }
    // @ts-ignore
    else if (inventory.has(item)) {
      const status: Switch = inventory.invertStatus(item as PowerUps);

      // emit the 'selected' event
      tuple[1].emit('selected', status);
    }

    return this;
  }
}
