import type { DamageSource, Defense } from "@/combat/damage";
import { TILE_SIZE } from "@/config/tiles";

/**
 * What an enemy is, apart from how it thinks: one entry for every kind. To add
 * a kind of enemy: add it here, write its class (see `enemies/Enemy`) and
 * list the class in `enemies/registry`. The numbers are placeholders, for the
 * game design to set.
 */
export interface EnemyDefinition {
  /** The texture of its sprite: a colored box (see `color`) until it has art */
  texture: string;
  /** The color of the box which stands for its sprite, until it has art */
  color: number;
  /** The size of its body, in pixels */
  width: number;
  height: number;
  /** The life it starts with */
  life: number;
  /** How fast it moves, in pixels for a second */
  speed: number;
  /** What protects it from the damage it takes */
  defense?: Defense;
  /** What it does to the Player which touches it */
  contact: DamageSource;
  /** Milliseconds between two hits on the Player who stays on it */
  contactCooldown: number;
}

export const ENEMY_DEFINITIONS = {
  /** Walks back and forth until a wall or a hole */
  walker: {
    texture: "enemy_walker",
    color: 0xc0392b,
    width: TILE_SIZE,
    height: TILE_SIZE,
    life: 6,
    speed: TILE_SIZE * 2,
    contact: { kind: "physical", amount: 5 },
    contactCooldown: 800,
  },
} as const satisfies Record<string, EnemyDefinition>;

export type EnemyKind = keyof typeof ENEMY_DEFINITIONS;

export const ENEMY_KINDS = Object.keys(ENEMY_DEFINITIONS) as EnemyKind[];

export function isEnemyKind(value: unknown): value is EnemyKind {
  return typeof value === "string" && value in ENEMY_DEFINITIONS;
}
