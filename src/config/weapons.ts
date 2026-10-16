import type { DamageSource } from "@/combat/damage";
import type { WeaponId } from "@/miscellaneous/Inventory";

/**
 * UI metadata for the weapons. Class names must not be used for this:
 * minified production builds rename them.
 */
export const WEAPON_META: Record<WeaponId, { label: string; hud: string }> = {
  gun: { label: "Gun", hud: "G" },
  rifle: { label: "Rifle", hud: "R" },
  bow: { label: "Bow", hud: "B" },
};

/**
 * What a shot of every weapon hurts with. It is damage like any other (see
 * `combat/damage`): when a shot lands on something with life, it is
 * `applyDamage(target, WEAPON_DAMAGE[weapon])`, and the target takes what its
 * own defense lets through. PLACEHOLDER numbers, for the game design to set.
 */
export const WEAPON_DAMAGE: Readonly<Record<WeaponId, DamageSource>> = {
  gun: { kind: "physical", amount: 2 },
  rifle: { kind: "physical", amount: 4 },
  bow: { kind: "physical", amount: 3 },
};
