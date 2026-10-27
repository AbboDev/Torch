# Phaser 4 & Tiled Integration Rules

- **Thin Scenes:** Keep `src/game/scenes/` lightweight. Delegate entity logic to `src/game/entities/` and pure math to `src/core/`.
- **Tiled Layer Hierarchy (v1.12+):**
  1. `Foreground` (Tile Layer - No collision)
  2. `UI_Triggers` (Object Layer - Optional interaction triggers)
  3. `Entities` (Object Layer - Spawns: PlayerSpawn, PowerUp, EnemySpawn, Door)
  4. `World_Collision` (Tile Layer - `collides: true`)
  5. `Background_Details` (Tile Layer - No collision)
  6. `Background` (Tile Layer - Parallax / Sights)
- **Tiled Config:** Use `.tiled-project` in `src/assets/tilemaps/` and ensure `.tiled-session` is ignored in git.
