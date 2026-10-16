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

## 🏃 How the Player moves

`src/entities/player/movement/PlayerMovement.ts` is a state machine: at any time the
Player is in **one** of these states.

| State            | Meaning                                     | Gravity |
| ---------------- | ------------------------------------------- | ------- |
| `GROUNDED`       | standing or running on the floor            | yes     |
| `CROUCHING`      | crouching on the floor                      | yes     |
| `AIRBORNE`       | in the air: a jump, a fall, a launch        | yes     |
| `HANGING`        | hanging from the edge of a ledge            | no      |
| `ON_LADDER`      | holding a ladder                            | no      |
| `CLIMBING_LEDGE` | pulling itself up a ledge, not controllable | no      |

Every frame jump, walk, dash, hang, ladders and crouch run in that order; each asks the
state what it can do and changes it when something happens. At the end of the frame the
state is settled (floor or air) and the gravity is set for it in one place. `Player` only
gives the machine what it needs (`MovementHost`: buttons, body, sensors, speeds), so the
machine does not depend on Phaser and is tested with a fake Player.

The speeds are in `movement.ts`, the stop and turn of the run in `horizontalMotion.ts`, the
coyote time and jump buffer in `JumpAssist.ts`, the sensors in `PlayerSensors.ts`.

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
"visited" rooms are the map and the id Tiled gives to the object
(`chozodia/room_6`), so names do not need to be unique and two maps can have
the same ids.

To add a background, add its images to the Preloader and list its layers, from
the farthest to the nearest, in `src/config/backgrounds.ts`. A test checks that
every texture of the table is loaded.

### Doors

An object of type `door` (a rectangle) takes the Player to another place in the
map, even to a room which does not touch the current one: the screen fades to
black and the Player appears at the target.

| Property     | Type            | Meaning                                                                                                                                                                                     |
| ------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target`     | object / string | **Required.** The object where the Player appears (a point, like `spawn_point`). Pick it as an _object_ property: names are not unique.                                                     |
| `requiresUp` | bool            | The Player has to press Up inside the door (default: touching is enough)                                                                                                                    |
| `targetMap`  | string          | The name of another map, when the target is there (`target` is then the id or the name of an object of that map). The game does not change map yet: such a door is ignored, with a warning. |

A door without a valid target or size is ignored, with a warning in the console.
After going through a door the Player can arrive inside another door (the one
which leads back): doors work again only after it has stepped out of all of them.

### Slopes

Arcade Physics only knows boxes, so sloping ground is made by `src/world/Slopes.ts`.
It is optional: a map without a layer called `slopes` works as before.

1. In the tileset, give every sloping tile two integer properties, the height of the
   ground at its **left** and at its **right** edge, from the bottom of the tile (0 to 16):

   | Tile                           | `slopeLeft` | `slopeRight` |
   | ------------------------------ | ----------- | ------------ |
   | 45° ramp going up to the right | 0           | 16           |
   | 45° ramp going up to the left  | 16          | 0            |
   | gentle ramp, first tile        | 0           | 8            |
   | gentle ramp, second tile       | 8           | 16           |
   | flat ground (next to a ramp)   | 16          | 16           |

2. Paint them in a tile layer named `slopes`. The ground is a straight line between the
   two heights, and it is solid from the line down to the bottom of the tile.
3. Put **all the ground next to a ramp in that layer**: the flat tiles before and after
   it too (16 and 16). Going from a ramp to a normal solid floor, the Player is in the
   air for some frames.
4. Do not fill the body of the ramp, under the line, with tiles of the `collision`
   layer. Tiles of the `slopes` layer without the two properties are only art.
5. Slopes are ground only: there are no sloping ceilings.

The slopes are drawn in orange with the other collisions in debug mode, to check what was
set in Tiled. The Player stands with the center of its body on the ground (change
`FOOT_OFFSETS` in `Slopes.ts` to use more points), and bullets stop at the slopes. On a
45° ramp the Player goes up as fast as it goes forward, so it is 1.4 times faster along
the ramp.

### Adding a kind of object (an enemy, a pickup, a switch...)

The objects of a map are made by a registry (`src/world/objectRegistry.ts`): it finds
what to do with the class of each object, checks its properties with the schema of the
class, and lets a handler make it. An object which is wrong (a class the game does not
know, one in the wrong layer, a wrong property) is told in the console and left out,
and the others are made anyway.

1. Describe it in `src/world/objectSchemas.ts`: its class, the layer it goes in, its
   properties with type and default, and add it to `OBJECT_SCHEMAS`.
2. Add a method for it to `MapObjectContext` and a handler in
   `src/world/mapObjectHandlers.ts` (the handler only says which object is what).
3. Do what is needed with it in `MainScene.createObjectContext()`.

### Checking the maps

`src/world/mapValidation.ts` checks a map as the game reads it, and `tests/unit/maps.test.ts`
runs it on **every** file of `assets/maps/`: the layers and tilesets the scene needs, the size of
the tiles, every object (class, layer, properties), rooms which overlap (touching borders are
fine), one spawn point inside a room, save points with different names inside a room, doors which
lead inside a room. Errors fail the tests. What is probably a mistake but works (two rooms with the
same name, an area with no save point, an unknown property) is printed; run
`VITE_STRICT_MAPS=1 npm test` (PowerShell: `$env:VITE_STRICT_MAPS=1; npm test`) to make it fail
too. With `npm run dev` the same check runs when the game starts and writes to the console.

A place which a door leads to is an object of class `marker`.

### The Tiled project

Open `assets/torch.tiled-project` in Tiled: it knows the maps and tilesets, and the object
types (`assets/objecttypes.json`): choosing the class `door` for an object gives it the
properties `target`, `targetMap` and `requiresUp` with their defaults, `platform` gives
`speed`, `direction` and `distance`, and so on. They are made from the schemas in
`src/world/objectSchemas.ts`, so they can not differ from what the game reads: after changing
a schema run `npm run tiled:project` (a test fails if the files are not up to date).

The files are written for the object types of Tiled 1.8, the version `chozodia.json` was saved
with. Newer versions call the class of an object `class` in the JSON instead of `type`: the game
reads both.

### Save points

An object of type `save_point`: its `name`, with the name of the map, is what the
save remembers, and the game restarts from there.
