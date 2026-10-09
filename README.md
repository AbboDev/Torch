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

---

## 🗺️ Rooms, doors and backgrounds (Tiled)

Everything below is set in the `objects` layer of the map, with custom properties.

### Rooms

An object of type `room` (a rectangle). The camera is limited to the room the
Player is in, and the left and top borders belong to the room: rooms which share
a border do not overlap. Rooms which touch are joined by a scroll of the camera.

| Property     | Type   | Meaning                                                             |
| ------------ | ------ | ------------------------------------------------------------------- |
| `background` | string | A name from `src/config/backgrounds.ts` (`laboratory`, `mountains`) |
| `dark`       | string | The ambient color of the room, as `RRGGBB`                          |

A room without `background` keeps the one of the previous room. The saved
"visited" rooms use the id Tiled gives to the object, so names do not need to
be unique.

To add a background, add its images to the Preloader and list its layers, from
the farthest to the nearest, in `src/config/backgrounds.ts`. A test checks that
every texture of the table is loaded.

### Doors

An object of type `door` (a rectangle) takes the Player to another place in the
map, even to a room which does not touch the current one: the screen fades to
black and the Player appears at the target.

| Property     | Type            | Meaning                                                                                                                                 |
| ------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `target`     | object / string | **Required.** The object where the Player appears (a point, like `spawn_point`). Pick it as an _object_ property: names are not unique. |
| `requiresUp` | bool            | The Player has to press Up inside the door (default: touching is enough)                                                                |

A door without a valid target or size is ignored, with a warning in the console.
After going through a door the Player can arrive inside another door (the one
which leads back): doors work again only after it has stepped out of all of them.

### Save points

An object of type `save_point`: its `name` is the id stored in the save, and the
game restarts from there.
