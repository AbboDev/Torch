import { Switch } from 'Miscellaneous';
import { Weapon } from 'Entities/Weapons';
import { ContinuousScene } from 'Scenes';

export enum PowerUps {
  TORCH = 'torch',
  ROCKET = 'doubleJump',
  BOOTS = 'highJump',
  GLOVE = 'wallJump',
  BOOSTER = 'boostedRun',
  FAN = 'swim',
  HOOK = 'hang',
  DASH = 'dash',
}

export class Inventory {
  private static instance: Inventory;

  /**
   * The Player has the torch
   *
   * @type {Boolean}
   */
  private torch: Switch = Switch.ENABLE;

  /**
   * The Player has obtained the battery
   *
   * @type {Boolean}
   */
  private battery: Switch = Switch.ENABLE;

  /**
   * The Player has the ability to do the double jump
   *
   * @type {Boolean}
   */
  private doubleJump: Switch = Switch.DISABLE;

  /**
   * The Player has the ability to perform an high jump
   *
   * @type {Boolean}
   */
  private highJump: Switch = Switch.DISABLE;

  /**
   * The Player has the ability to perform a wall jump
   *
   * @type {Boolean}
   */
  private wallJump: Switch = Switch.DISABLE;

  /**
   * The Player has the ability to run quickly
   *
   * @type {Boolean}
   */
  private boostedRun: Switch = Switch.DISABLE;

  /**
   * The Player has the ability to move normally into liquid
   *
   * @type {Boolean}
   */
  private swim: Switch = Switch.DISABLE;

  /**
   * The Player has the ability to hang to cliffs
   *
   * @type {Boolean}
   */
  private hang: Switch = Switch.ENABLE;

  /**
   * The Player has the ability to make an horizontal dash
   *
   * @type {Boolean}
   */
  private dash: Switch = Switch.DISABLE;

  private weapons: Weapon[] = [];

  private _activeWeaponsIndex: number = 0;

  private constructor(protected scene: ContinuousScene, load?: Inventory) {
    console.debug(load);
  }

  /**
   * The static method that controls the access to the singleton instance.
   */
  public static getInstance(scene: ContinuousScene, load?: Inventory): Inventory {
    if (!Inventory.instance) {
      Inventory.instance = new Inventory(scene, load);
    }

    return Inventory.instance;
  }

  public get(item: PowerUps): Switch {
    return this[item];
  }

  public has(item: PowerUps): boolean {
    return this[item] !== Switch.INDETERMINATE;
  }

  public equip(item: PowerUps): boolean {
    return this[item] === Switch.ENABLE;
  }

  public getCurrentWeapon(): Weapon | null {
    return this.getWeapon(this.activeWeaponsIndex);
  }

  public getWeapon(index: number): Weapon | null {
    return this.weapons[index];
  }

  public switchCurrentWeapon(index: number): Inventory {
    if (index < 0) {
      this.activeWeaponsIndex = this.weapons.length - 1 || 0;
    } else if (index >= this.weapons.length) {
      this.activeWeaponsIndex = 0;
    } else {
      this.activeWeaponsIndex = index;
    }

    return this;
  }

  public switchToNextWeapon(): Inventory {
    return this.switchCurrentWeapon(this.activeWeaponsIndex + 1);
  }

  public switchToPreviousWeapon(): Inventory {
    return this.switchCurrentWeapon(this.activeWeaponsIndex - 1);
  }

  public pushWeapon(weapon: Weapon): Inventory {
    this.weapons.push(weapon);

    return this;
  }

  public hasAtLeastOneRangeWeapon(): boolean {
    return this.weapons.length > 0;
  }

  public resetWeaponsShoot(): Inventory {
    if (this.hasAtLeastOneRangeWeapon()) {
      for (const weapon of this.weapons) {
        weapon.canShoot();
      }
    }

    return this;
  }

  public set(item: PowerUps, status: Switch): Inventory {
    this[item] = status;

    return this;
  }

  public invertStatus(item: PowerUps): Switch {
    if (this[item] === Switch.ENABLE) {
      this[item] = Switch.DISABLE;
    } else if (this[item] === Switch.DISABLE) {
      this[item] = Switch.ENABLE;
    }

    return this[item];
  }

  public hasBattery(): boolean {
    return this.battery === Switch.ENABLE;
  }

  public get activeWeaponsIndex(): number {
    return this._activeWeaponsIndex;
  }

  public set activeWeaponsIndex(index: number) {
    this._activeWeaponsIndex = index;

    this.scene.events.emit('changedWeapon', this.getCurrentWeapon());
  }
}
