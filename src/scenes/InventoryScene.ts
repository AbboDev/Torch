import * as Phaser from "phaser";
import { ControllerKey } from "@/miscellaneous/Controller";
import { Switch } from "@/miscellaneous/Switch";
import { PowerUps, WeaponId } from "@/miscellaneous/Inventory";
import { ItemSwitch } from "@/hud/ItemSwitch";
import { DataScene } from "@/scenes/DataScene";
import { TILE_SIZE } from "@/config/tiles";
import { WEAPON_META } from "@/config/weapons";

type InventoryItem =
  { kind: "powerUp"; id: PowerUps } | { kind: "weapon"; id: WeaponId };

type InventoryButton = [InventoryItem, ItemSwitch];

const WEAPON_ORDER: readonly WeaponId[] = ["bow", "gun", "rifle"];

export class InventoryScene extends DataScene {
  private cursor!: Phaser.GameObjects.Triangle;

  private buttons: InventoryButton[][] = [];

  private selectedButtonIndex: [number, number] = [0, 0];

  public constructor() {
    super({
      active: false,
      visible: false,
      key: "inventory",
    });
  }

  public create(): void {
    super.create();

    const { width } = this.scale;

    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${TILE_SIZE}px`,
    };

    this.add
      .text(width / 2, TILE_SIZE / 2, "inventory", style)
      .setAlign("center")
      .setOrigin(0.5);

    this.cursor = this.add
      .triangle(
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
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        const currentValue = tween.getValue();

        if (currentValue !== null) {
          const value = Math.floor(currentValue);
          this.cursor.setFillStyle(
            Phaser.Display.Color.GetColor(0, value, value)
          );
        }
      },
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

      this.buttons[0].push([{ kind: "powerUp", id: key }, button]);
      previousY = button.y + TILE_SIZE * 1.5;
    }

    previousY = TILE_SIZE * 2;
    for (const weaponId of WEAPON_ORDER) {
      let value = Switch.INDETERMINATE;
      if (this.getInventory().carry(weaponId)) {
        value =
          this.getInventory().getCurrentWeaponId() === weaponId
            ? Switch.ENABLE
            : Switch.DISABLE;
      }

      const button = new ItemSwitch(
        this,
        TILE_SIZE * 12,
        previousY,
        WEAPON_META[weaponId].label,
        value
      );

      if (!this.buttons[1]) {
        this.buttons[1] = [];
      }

      this.buttons[1].push([{ kind: "weapon", id: weaponId }, button]);
      previousY = button.y + TILE_SIZE * 1.5;
    }

    this.selectButton(this.selectedButtonIndex);

    this.cameras.main.setBackgroundColor("rgba(0, 0, 0, 0.75)");

    // A power-up picked up while the inventory is closed
    this.watchState("powerUp", (powerUp, status) => {
      const button = this.buttons[0].find(([item]) => item.id === powerUp);

      button?.[1].emit("selected", status);
    });

    // A save has been loaded (or a new game started): show what the Player owns now
    this.watchState("restored", () => {
      this.refreshButtons();
    });

    this.watchState("weapon", (weaponId) => {
      if (!weaponId) {
        return;
      }

      for (let index = 0; index < this.buttons[1].length; index++) {
        const [item, itemSwitch] = this.buttons[1][index];

        const isActive: boolean = item.id === weaponId;
        const status: Switch = isActive ? Switch.ENABLE : Switch.DISABLE;

        if (isActive) {
          this.selectButton([1, index]).confirmSelection();
        }

        itemSwitch.emit("selected", status);
      }
    });
  }

  public update(time: any, delta: number): void {
    super.update(time, delta);

    const isStartPressed: boolean =
      this.getController().isKeyPressedForFirstTime(ControllerKey.START);

    if (isStartPressed) {
      this.scene.resume("main").sleep();
    }

    const isUpPress: boolean = this.getController().isKeyPressedForFirstTime(
      ControllerKey.UP
    );

    const isDownPress: boolean = this.getController().isKeyPressedForFirstTime(
      ControllerKey.DOWN
    );

    const isLeftPress: boolean = this.getController().isKeyPressedForFirstTime(
      ControllerKey.LEFT
    );

    const isRightPress: boolean = this.getController().isKeyPressedForFirstTime(
      ControllerKey.RIGHT
    );

    const isAPress: boolean = this.getController().isKeyPressedForFirstTime(
      ControllerKey.A
    );

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

  /**
   * Show the power-ups and weapons the Player owns now, whatever they were
   */
  private refreshButtons(): void {
    const inventory = this.getInventory();

    for (const [item, button] of this.buttons[0]) {
      if (item.kind === "powerUp") {
        button.emit("selected", inventory.get(item.id));
      }
    }

    for (const [item, button] of this.buttons[1]) {
      let status = Switch.INDETERMINATE;

      if (inventory.carry(item.id as WeaponId)) {
        status =
          inventory.getCurrentWeaponId() === item.id
            ? Switch.ENABLE
            : Switch.DISABLE;
      }

      button.emit("selected", status);
    }
  }

  private selectNextButton(
    horizontalMovement = 0,
    verticalMovement = 1
  ): InventoryScene {
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
      newVertical =
        newHorizontal === 0 ? 0 : this.buttons[newHorizontal].length - 1;
    } else if (newVertical < 0) {
      newVertical = this.buttons[newHorizontal].length - 1;
    }

    const movement: [number, number] = [newHorizontal, newVertical];

    return this.selectButton(movement);
  }

  private selectButton(index: [number, number]): InventoryScene {
    const [oldHorizontal, oldVertical]: [number, number] =
      this.selectedButtonIndex;
    const currentTuple: InventoryButton =
      this.buttons[oldHorizontal][oldVertical];

    if (currentTuple.length !== 2) {
      throw new Error("Invalid tuple");
    }

    const button: ItemSwitch = currentTuple[1];

    // set the current selected button to a white tint
    button.setStrokeStyle(button.lineWidth, 0xffffff);

    const [horizontal, vertical]: [number, number] = index;
    const nextTuple: InventoryButton = this.buttons[horizontal][vertical];

    if (nextTuple.length !== 2) {
      throw new Error("Invalid tuple");
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

    const [item] = tuple;
    const inventory = this.getInventory();

    if (item.kind === "weapon") {
      if (inventory.carry(item.id)) {
        if (inventory.getCurrentWeaponId() === item.id) {
          return this;
        }

        inventory.switchCurrentWeapon(item.id);

        for (const [currentItem, currentButton] of this.buttons[horizontal]) {
          const status: Switch =
            currentItem.id === inventory.getCurrentWeaponId()
              ? Switch.ENABLE
              : Switch.DISABLE;

          currentButton.emit("selected", status);
        }
      }
    } else if (inventory.has(item.id)) {
      const status: Switch = inventory.invertStatus(item.id);

      // emit the 'selected' event
      tuple[1].emit("selected", status);
    }

    return this;
  }
}
