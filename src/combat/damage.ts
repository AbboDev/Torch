/**
 * The damage of the game, with no dependency on Phaser. Everything which hurts
 * (a liquid, a zone, a shot, an enemy) is a `DamageSource`; everything with
 * life (the Player, an enemy) is a `Damageable`; and `getDamage` is how much a
 * source hurts a defense. So they all go through the same rules, and armor,
 * shields and power-ups work with all of them.
 */

/** What kind of harm it is: what a defense is for (a suit against fire...) */
export const DAMAGE_KINDS = [
  "physical",
  "fire",
  "acid",
  "corruption",
  "heat",
  "toxic",
] as const;

export type DamageKind = (typeof DAMAGE_KINDS)[number];

/** Something which hurts: a hit, or one tick of what hurts over time */
export interface DamageSource {
  kind: DamageKind;
  /** The life it takes, before the resistances */
  amount: number;
  /**
   * The life it takes from an entity protected from this kind (see `Defense`).
   * If it is not given, protection is all it takes: no damage.
   */
  protectedAmount?: number;
}

/** What protects an entity: a power-up, a suit, the armor, the shield */
export interface Defense {
  /**
   * The kinds of damage the entity is protected from: the source then hurts
   * for its `protectedAmount`, instead of its `amount`
   */
  protections: ReadonlySet<DamageKind>;
  /**
   * How much of a kind of damage is stopped, from 0 (nothing) to 1 (all of it),
   * whether the entity is protected or not. This is what armor and shields give.
   */
  resistances: Partial<Record<DamageKind, number>>;
}

/** The defense of an entity which has none */
export const NO_DEFENSE: Defense = Object.freeze({
  protections: new Set<DamageKind>(),
  resistances: {},
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * How much life a source takes from an entity with this defense. It is never
 * negative, and it is never more than the source says.
 */
export function getDamage(
  source: DamageSource,
  defense: Defense = NO_DEFENSE
): number {
  const amount = defense.protections.has(source.kind)
    ? (source.protectedAmount ?? 0)
    : source.amount;
  const resistance = clamp(defense.resistances[source.kind] ?? 0, 0, 1);
  const damage = amount * (1 - resistance);

  return Number.isFinite(damage) && damage > 0 ? damage : 0;
}

/**
 * Put defenses together, like the ones of the armor and of the shield: the
 * entity is protected from all they protect from, and the resistances of a
 * kind add up without ever passing 1 (two of one half stop three quarters).
 */
export function combineDefenses(...defenses: Defense[]): Defense {
  const protections = new Set<DamageKind>();
  const left: Partial<Record<DamageKind, number>> = {};

  for (const defense of defenses) {
    defense.protections.forEach((kind) => protections.add(kind));

    for (const kind of DAMAGE_KINDS) {
      const resistance = clamp(defense.resistances[kind] ?? 0, 0, 1);

      if (resistance > 0) {
        left[kind] = (left[kind] ?? 1) * (1 - resistance);
      }
    }
  }

  const resistances: Partial<Record<DamageKind, number>> = {};
  for (const kind of DAMAGE_KINDS) {
    if (left[kind] !== undefined) {
      resistances[kind] = 1 - (left[kind] as number);
    }
  }

  return { protections, resistances };
}

/** Anything with life which can be hurt: the Player, an enemy */
export interface Damageable {
  /** What protects it now */
  getDefense(): Defense;
  /** Take life away: it is `getDamage` of the source, never 0 */
  takeDamage(amount: number, source: DamageSource): void;
}

/**
 * Hurt something with a source, by the rules of its defense.
 *
 * @return The life it took, 0 if the target is not hurt
 */
export function applyDamage(
  target: Damageable,
  source: DamageSource
): number {
  const damage = getDamage(source, target.getDefense());

  if (damage > 0) {
    target.takeDamage(damage, source);
  }

  return damage;
}
