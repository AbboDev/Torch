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
