import type { DamageKind } from "@/combat/damage";
import { PowerUps } from "@/miscellaneous/Inventory";

/**
 * What the power-ups protect the Player from, as long as they are equipped
 * (see `Defense`): the damage of that kind is then the protected amount of
 * its source. No power-up does yet. To make one, add it to `PowerUps` and
 * write here what it protects from, for example:
 *
 *     [PowerUps.SUIT]: ["corruption", "fire"],
 */
export const POWER_UP_PROTECTIONS: Readonly<
  Partial<Record<PowerUps, readonly DamageKind[]>>
> = {};
