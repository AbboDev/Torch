# Torch

A 2D Metroidvania game built with **Phaser 4**, **TypeScript**, **Vite**, and **Tiled**, wrapped for desktop distribution with **Tauri** (WIP). Inspired by classics like _Super Metroid_, the game features 8-directional aiming, shared ammo mechanics, dynamic 2D lighting, 360° grapple beam mechanics, breakable tiles and a lot of features.

---

## 🛠️ Tech Stack

- **Game Engine:** [Phaser 4](https://phaser.io/) (Arcade Physics + Custom Mechanics)
- **Language:** TypeScript
- **Build Tool / Bundler:** [Vite](https://vitejs.dev/)
- **Level Design:** [Tiled Map Editor](https://www.mapeditor.org/) (JSON Format)
- **Desktop Wrapper:** [Tauri](https://tauri.app/)

---

## 📋 Requirements

- **Node.js:** v24 LTS
- **Package Manager:** npm

---

## 🚀 Getting Started

| Command             | Description                                                    |
| :------------------ | :------------------------------------------------------------- |
| `npm install`       | Install all dependencies.                                      |
| `npm run dev`       | Start the Vite development server at `http://localhost:5173/`. |
| `npm run typecheck` | Run TypeScript type check without emitting files.              |
| `npm run build`     | Create a minified production build in `build/`.                |
| `npm run build:dev` | Create a source-mapped, unminified build in `build/`.          |

---

## 🧪 Testing

| Command                    | Description                         |
| :------------------------- | :---------------------------------- |
| `npm test`                 | Run all unit and integration tests. |
| `npm run test:unit`        | Run unit tests only.                |
| `npm run test:integration` | Run integration tests only.         |
| `npm run test:watch`       | Run tests in watch mode.            |

Place unit tests in `tests/unit/` and integration tests in `tests/integration/` using the `*.test.ts` naming convention.

- **Unit Tests:** Isolate individual modules (e.g., `AmmoSystem`, `TileBreakSystem`).
- **Integration Tests:** Exercise interactions between game modules (e.g., `PlayerController` with physics layers).
- Browser-driven E2E tests are handled separately via **Cypress**.

---

## 📂 Project Structure

```text
├── public/
│   └── assets/              # Tiled JSON maps, tilesets, and spritesheets
├── src/
│   ├── entities/            # Player, enemies, and projectile classes
│   ├── scenes/              # Phaser 4 scenes (BootScene, GameScene, UI)
│   ├── systems/             # Tile destruction, lighting, ammo, grapple beam
│   └── main.ts              # Game configuration & entry point
├── tests/
│   ├── unit/                # Unit test files (*.test.ts)
│   └── integration/         # Integration test files (*.test.ts)
├── build/                   # Compiled production output
├── index.html
├── package.json
└── tsconfig.json
```
