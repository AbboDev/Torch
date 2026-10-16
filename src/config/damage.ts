import type { Damage } from "@/world/darkness";

/**
 * The life a tick of damage takes, for the words the specification of the
 * levels of darkness uses (`DARKNESS_SPEC`): the numbers are for the game
 * design to change.
 */
export const DAMAGE_AMOUNTS: Readonly<Record<Damage, number>> = {
  none: 0,
  little: 1,
  light: 2,
  heavy: 5,
};

/** Milliseconds between two ticks of the damage of a zone */
export const ZONE_TICK = 200;
