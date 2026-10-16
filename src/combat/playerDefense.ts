import type { DamageKind, Defense } from "@/combat/damage";
import { POWER_UP_PROTECTIONS } from "@/config/protections";
import type { PowerUps } from "@/miscellaneous/Inventory";

/**
 * What protects the Player now: what its equipped power-ups protect from. The
 * armor and the shield will add their resistances with `combineDefenses`.
 *
 * @param isEquipped Tells if the Player has the power-up, and it is turned on
 */
export function getPlayerDefense(
  isEquipped: (item: PowerUps) => boolean,
  protections: Readonly<
    Partial<Record<PowerUps, readonly DamageKind[]>>
  > = POWER_UP_PROTECTIONS
): Defense {
  const kinds = new Set<DamageKind>();

  for (const [item, protectedFrom] of Object.entries(protections)) {
    if (isEquipped(item as PowerUps)) {
      protectedFrom.forEach((kind) => kinds.add(kind));
    }
  }

  return { protections: kinds, resistances: {} };
}
