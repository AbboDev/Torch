import { Weapon } from "@/entities/weapons/Weapon";
import { Gun } from "@/entities/weapons/Gun";
import { Rifle } from "@/entities/weapons/Rifle";
import { Bow } from "@/entities/weapons/Bow";
import { WeaponId } from "@/miscellaneous/Inventory";
import { MapScene } from "@/scenes/MapScene";

const WEAPON_CLASSES: Record<WeaponId, new (scene: MapScene) => Weapon> = {
  gun: Gun,
  rifle: Rifle,
  bow: Bow,
};

/**
 * The Phaser side of the weapons: it owns the actual `Weapon` groups of the
 * current scene, created on demand, while the Inventory only knows the ids.
 * A new Arsenal is built with the scene, so nothing outlives it.
 */
export class Arsenal {
  private weapons = new Map<WeaponId, Weapon>();

  public constructor(private readonly scene: MapScene) {}

  public get(id: WeaponId): Weapon {
    let weapon = this.weapons.get(id);
    if (!weapon) {
      weapon = new WEAPON_CLASSES[id](this.scene);
      this.weapons.set(id, weapon);
    }

    return weapon;
  }

  public getCurrent(): Weapon | null {
    const id = this.scene.getInventory().getCurrentWeaponId();

    return id ? this.get(id) : null;
  }

  public resetShoot(): void {
    for (const weapon of this.weapons.values()) {
      weapon.canShoot();
    }
  }
}
