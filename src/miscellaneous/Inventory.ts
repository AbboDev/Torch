import { Switch } from "@/miscellaneous/Switch";

export enum PowerUps {
  TORCH = "torch",
  ROCKET = "doubleJump",
  BOOTS = "highJump",
  GLOVE = "wallJump",
  BOOSTER = "boostedRun",
  FAN = "swim",
  HOOK = "hang",
  DASH = "dash",
}

/**
 * Stable identifiers of the weapons. They are what gets stored in the save
 * file: the actual Phaser objects live in the `Arsenal` of the current scene.
 */
export type WeaponId = "gun" | "rifle" | "bow";

export const WEAPON_IDS: readonly WeaponId[] = ["bow", "gun", "rifle"];

export interface InventorySnapshot {
  powerUps: Record<PowerUps, Switch>;
  battery: Switch;
  weapons: WeaponId[];
  activeWeapon: number;
}

export interface InventoryNotifier {
  weaponChanged(weapon: WeaponId | null): void;
  powerUpChanged(item: PowerUps, status: Switch): void;
}

/** No power-up is owned until it is granted (INDETERMINATE). */
const defaultPowerUps = (): Record<PowerUps, Switch> => ({
  [PowerUps.TORCH]: Switch.INDETERMINATE,
  [PowerUps.ROCKET]: Switch.INDETERMINATE,
  [PowerUps.BOOTS]: Switch.INDETERMINATE,
  [PowerUps.GLOVE]: Switch.INDETERMINATE,
  [PowerUps.BOOSTER]: Switch.INDETERMINATE,
  [PowerUps.FAN]: Switch.INDETERMINATE,
  [PowerUps.HOOK]: Switch.INDETERMINATE,
  [PowerUps.DASH]: Switch.INDETERMINATE,
});

const isSwitch = (value: unknown): value is Switch =>
  Object.values(Switch).includes(value as Switch);

const isWeaponId = (value: unknown): value is WeaponId =>
  WEAPON_IDS.includes(value as WeaponId);

/**
 * Plain data: no Phaser objects, no reference to any scene.
 * It is owned by the `GameState`, which also takes care of save/load.
 */
export class Inventory {
  private powerUps: Record<PowerUps, Switch> = defaultPowerUps();

  /**
   * The Player has obtained the battery
   */
  private battery: Switch = Switch.ENABLE;

  private weapons: WeaponId[] = [];

  private activeWeaponIndex = 0;

  public constructor(
    private readonly notifier: InventoryNotifier = {
      weaponChanged: () => {},
      powerUpChanged: () => {},
    }
  ) {}

  public get(item: PowerUps): Switch {
    return this.powerUps[item];
  }

  /** The Player owns the power-up (it may be turned off) */
  public has(item: PowerUps): boolean {
    return this.powerUps[item] !== Switch.INDETERMINATE;
  }

  /** The Player owns the power-up and it is turned on: it can be used */
  public equip(item: PowerUps): boolean {
    return this.powerUps[item] === Switch.ENABLE;
  }

  public set(item: PowerUps, status: Switch): Inventory {
    this.powerUps[item] = status;
    this.notifier.powerUpChanged(item, status);

    return this;
  }

  /**
   * Hand a power-up to the Player (e.g. when picked up) and turn it on.
   * One already owned keeps its current status.
   */
  public grant(item: PowerUps): Inventory {
    if (this.has(item)) {
      return this;
    }

    return this.set(item, Switch.ENABLE);
  }

  /** Turn an owned power-up on or off. One not owned stays as it is. */
  public invertStatus(item: PowerUps): Switch {
    if (this.powerUps[item] === Switch.ENABLE) {
      this.set(item, Switch.DISABLE);
    } else if (this.powerUps[item] === Switch.DISABLE) {
      this.set(item, Switch.ENABLE);
    }

    return this.powerUps[item];
  }

  public hasBattery(): boolean {
    return this.battery === Switch.ENABLE;
  }

  public carry(weapon: WeaponId): boolean {
    return this.weapons.includes(weapon);
  }

  public getWeaponIds(): readonly WeaponId[] {
    return this.weapons;
  }

  public getCurrentWeaponId(): WeaponId | null {
    return this.weapons[this.activeWeaponIndex] ?? null;
  }

  public hasAtLeastOneRangeWeapon(): boolean {
    return this.weapons.length > 0;
  }

  /**
   * Add a weapon to the inventory. Adding a weapon already carried does nothing.
   *
   * @param weapon The weapon to add
   * @param equip  Make it the active one (default: true)
   */
  public addWeapon(weapon: WeaponId, equip = true): Inventory {
    if (this.carry(weapon)) {
      return this;
    }

    this.weapons.push(weapon);

    if (equip) {
      this.activeWeaponIndex = this.weapons.length - 1;
    }

    this.notifier.weaponChanged(this.getCurrentWeaponId());

    return this;
  }

  public switchCurrentWeapon(target: number | WeaponId): Inventory {
    let index = typeof target === "number" ? target : -2;
    if (typeof target !== "number") {
      index = this.weapons.indexOf(target);
      if (index < 0) {
        // Not carried: keep the current weapon
        return this;
      }
    }

    if (index < 0) {
      this.activeWeaponIndex = this.weapons.length - 1 || 0;
    } else if (index >= this.weapons.length) {
      this.activeWeaponIndex = 0;
    } else {
      this.activeWeaponIndex = index;
    }

    this.notifier.weaponChanged(this.getCurrentWeaponId());

    return this;
  }

  public switchToNextWeapon(): Inventory {
    return this.switchCurrentWeapon(this.activeWeaponIndex + 1);
  }

  public switchToPreviousWeapon(): Inventory {
    return this.switchCurrentWeapon(this.activeWeaponIndex - 1);
  }

  public snapshot(): InventorySnapshot {
    return {
      powerUps: { ...this.powerUps },
      battery: this.battery,
      weapons: [...this.weapons],
      activeWeapon: this.activeWeaponIndex,
    };
  }

  /**
   * Restore from a (possibly partial or outdated) snapshot, ignoring
   * anything unknown so an old or hand-edited save cannot break the game.
   */
  public restore(snapshot: Partial<InventorySnapshot> | undefined): void {
    this.powerUps = defaultPowerUps();
    for (const item of Object.values(PowerUps)) {
      const stored = snapshot?.powerUps?.[item];
      if (isSwitch(stored)) {
        this.powerUps[item] = stored;
      }
    }

    this.battery = isSwitch(snapshot?.battery)
      ? snapshot.battery
      : Switch.ENABLE;

    this.weapons = [...new Set((snapshot?.weapons ?? []).filter(isWeaponId))];

    const active = snapshot?.activeWeapon;
    this.activeWeaponIndex =
      Number.isInteger(active) &&
      (active as number) >= 0 &&
      (active as number) < this.weapons.length
        ? (active as number)
        : 0;
  }
}
