# Architecture & Clean Code Rules

- **Pure Business Logic:** Keep code in `src/core/` 100% agnostic of Phaser 4 and Tauri APIs.
- **Directory Enforcement:**
  - `src/core/fsm/` — State machines for Player, Enemies, Bosses.
  - `src/core/models/` — Data structures, interfaces, and types.
  - `src/core/utils/` — Pure mathematical and physics calculation helpers.
  - `src/services/` — Tauri IPC Bridge and Persistence APIs.
- **Code Style:** TypeScript strict mode required. Format with ESLint and Prettier. Use Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`).
