import { PlayerStats, STAT_KEYS, StatKey } from "@/state/GameState";

/** What the view needs from the game state */
interface StatsSource {
  get(key: StatKey): number;
  set(key: StatKey, value: number): void;
}

/**
 * The stats of the Player (`life`, `maxLife`, `ammo`, `maxAmmo`, `battery`,
 * `maxBattery`) as plain properties: reading one reads the game state,
 * writing one writes it (with its rules, and telling the HUD).
 *
 *     player.stats.life -= 5;
 */
export function createStatsView(source: StatsSource): PlayerStats {
  const view = {} as PlayerStats;

  for (const key of STAT_KEYS) {
    Object.defineProperty(view, key, {
      enumerable: true,
      get: () => source.get(key),
      set: (value: number) => source.set(key, value),
    });
  }

  return view;
}
