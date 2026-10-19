import type { EnemyKind } from "@/config/enemies";
import type { Enemy } from "@/enemies/Enemy";
import { Crawler } from "@/enemies/Crawler";
import { Jumper } from "@/enemies/Jumper";
import type { EnemySpawn } from "@/enemies/spawns";
import { Walker } from "@/enemies/Walker";
import type { MapScene } from "@/scenes/MapScene";

/** Makes the enemy of a kind where the map says */
export type EnemyFactory = (scene: MapScene, spawn: EnemySpawn) => Enemy;

/**
 * The class of every kind of enemy. The type asks for all the kinds of
 * `ENEMY_DEFINITIONS`: a kind with no class does not compile.
 */
export const ENEMY_FACTORIES: Record<EnemyKind, EnemyFactory> = {
  walker: (scene, spawn) => new Walker(scene, spawn),
  crawler: (scene, spawn) => new Crawler(scene, spawn),
  jumper: (scene, spawn) => new Jumper(scene, spawn),
};

export function createEnemy(scene: MapScene, spawn: EnemySpawn): Enemy {
  return ENEMY_FACTORIES[spawn.kind](scene, spawn);
}
