import type { DamageSource } from "@/combat/damage";
import { DAMAGE_AMOUNTS } from "@/config/damage";
import { DARKNESS_SPEC, DarknessType } from "@/world/darkness";

/**
 * What a zone with this level of darkness does to whoever is in it, at every
 * tick: a corrupted zone hurts with the kind "corruption", and what it takes
 * from who is protected from it is in the specification. Null if the zone does
 * no harm. It is hurt with `getDamage` like anything else.
 */
export function getZoneDamageSource(level: DarknessType): DamageSource | null {
  const spec = DARKNESS_SPEC[level];

  if (spec.unprotected === "none" && spec.protected === "none") {
    return null;
  }

  return {
    kind: "corruption",
    amount: DAMAGE_AMOUNTS[spec.unprotected],
    protectedAmount: DAMAGE_AMOUNTS[spec.protected],
  };
}
