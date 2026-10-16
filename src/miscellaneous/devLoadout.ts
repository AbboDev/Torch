import { Inventory, PowerUps } from "@/miscellaneous/Inventory";
import { Switch } from "@/miscellaneous/Switch";

/**
 * Give a new game everything, so it can be tested without playing for it:
 * all the weapons, and all the power-ups owned but turned off. The torch and
 * hook start on so light and ledge movement can be tested immediately.
 *
 * Nothing is done to a game which already has weapons, like a loaded save or
 * a restarted scene: it keeps what the Player owns.
 *
 * @return True if the loadout was applied
 */
export function applyDevLoadout(inventory: Inventory): boolean {
  if (inventory.hasAtLeastOneRangeWeapon()) {
    return false;
  }

  inventory
    .addWeapon("gun")
    .addWeapon("rifle")
    .addWeapon("bow")
    .switchCurrentWeapon("gun");

  for (const powerUp of Object.values(PowerUps)) {
    if (!inventory.has(powerUp)) {
      inventory.set(powerUp, Switch.DISABLE);
    }
  }

  inventory
    .set(PowerUps.TORCH, Switch.ENABLE)
    .set(PowerUps.HOOK, Switch.ENABLE);

  return true;
}
