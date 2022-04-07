import { Switch } from 'Miscellaneous';

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

export enum Weapons {
  GUN = 'gun',
  RIFLE = 'rifle',
  BOW = 'bow',
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

  /**
   * The Player has the gun range weapon
   *
   * @type {Boolean}
   */
  private gun: Switch = Switch.ENABLE;

  /**
   * The Player has the rifle range weapon
   *
   * @type {Boolean}
   */
  private rifle: Switch = Switch.DISABLE;

  /**
   * The Player has the bow range weapon
   *
   * @type {Boolean}
   */
  private bow: Switch = Switch.DISABLE;

  private constructor(load?: Inventory) {
    console.debug(load);
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(load?: Inventory): Inventory {
    if (!Inventory.instance) {
      Inventory.instance = new Inventory(load);
    }

    return Inventory.instance;
  }

  public get(item: PowerUps | Weapons): Switch {
    return this[item];
  }

  public has(item: PowerUps | Weapons): boolean {
    return this[item] !== Switch.INDETERMINATE;
  }

  public carry(item: Weapons): boolean {
    return this[item] === Switch.ENABLE;
  }

  public equip(item: PowerUps): boolean {
    return this[item] === Switch.ENABLE;
  }

  public set(item: PowerUps | Weapons, status: Switch): Inventory {
    this[item] = status;

    return this;
  }

  public invertStatus(item: PowerUps | Weapons): Switch {
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
}
