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

## 🎮 Input: keyboard, mouse and gamepad

`Controller` (`src/miscellaneous/Controller.ts`) turns every device into the same
buttons (`ControllerKey`), so the rest of the game does not know where they come from.
`setMode()` chooses which devices count:

| Mode            | Devices                                                          |
| --------------- | ---------------------------------------------------------------- |
| `keyboard`      | keyboard (default)                                               |
| `keyboardMouse` | keyboard + mouse buttons (left shoots, right aims by default)    |
| `gamepad`       | gamepad (d-pad and left stick); the keyboard works only if none is connected |

Every device has its own bindings (`src/input/bindings.ts`): keys as `event.code` or
`key`, mouse as `Mouse0`/`Mouse1`/`Mouse2`, gamepad as `Pad<index>` (standard layout).
A rebind screen calls `controller.bind(button, code, device)`: the key is taken from
the button which had it and those buttons are returned, to warn the player.

In game, **Inventory → Y** opens the controls menu (`src/scenes/ControlsScene.ts`):
Left/Right on the first row changes the device, A on an action waits for the new key
(`Esc` cancels), and the buttons which lose a key are named. Arrows, Space and Esc
always work there, so a wrong binding never locks the menu.

If the bindings become unusable, hold **Shift + Backspace** (keyboard) or **Select + Start**
(gamepad) for two seconds: the keys go back to the defaults (and the keyboard mode, from the
keyboard). It reads the raw keys, so it works whatever the bindings and the mode are.

In keyboard + mouse mode a crosshair (`src/scenes/CursorScene.ts`) follows the mouse, over every
scene, and takes the place of the system cursor.

### Free aim

With the mouse and with the gamepad the Player aims at any angle (`src/entities/player/FreeAim.ts`);
with the keyboard it aims in the eight directions of the buttons, and in between with the fine aim
button.

- **Mouse:** the shots go from the gun to the cursor.
- **Gamepad:** the right stick turns a cursor around the Player, at a fixed distance
  (`AIM_CURSOR_DISTANCE`). With the stick at rest the Player aims ahead, where it is going.
- **Keyboard:** while the fine aim button is held (`D` by default, not the aim button `A`, which
  still gives the 45 degrees), up and down raise and lower the angle (`KEYBOARD_AIM_SPEED`), starting
  from where the buttons were aiming; the cursor shows where it points. Let go of it and the buttons
  aim again, in eight directions. Holding it, down does not crouch.

The sprites only have eight directions, so they take the closest one, while the shots use the exact
angle (`BulletConfig.angle`). The sprite looks at the side of the aim; the movement keeps its own
`facing`, so dash and ledges do not change. As before, the Player has to look to a side (walk once)
before it aims and shoots.

Mode and bindings are stored in their own key (`torch:settings`, see
`src/input/inputSettings.ts`), apart from the saves. The gamepad has no events: the
Controller reads it once per frame (`update()`, called from `ContinuousScene`).

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
| `targetMap`  | string          | The name of another map, when the target is there (`target` is then the id or the name of an object of that map). The game loads that map and the Player appears at the target. |

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

An object of type `save_point` in the `objects` layer. Its `name` is required,
must be unique in the map and, together with the map key, is stored in the save
(see `src/world/savePoints.ts`).

- A **rectangle** is the area where the Player can save, and the Player restarts at
  its top center: draw it 2 tiles tall or more.
- A **point** works too: the area is 2 tiles wide and 4 tall around it, and the Player
  restarts exactly on it, like on the `spawn_point`.

Standing in the area, on the floor, **a fresh press of Up** heals the Player (life,
ammo and battery to the maximum) and saves the game. The game restarts from there.

### The game loop

```text
Preloader → Title (3 slots) ──→ Main + HUD
                                   │ life reaches 0
                                Game Over ──→ last save of the slot (or the start)
                                          └─→ Title
```

- **Title**: three save slots (`SLOT_COUNT` in `SaveManager.ts`), each showing what the
  game in it has reached. An empty slot starts a new game. A slot with a game asks
  _Continue_ or _Erase it and start over_ (a step of its own, so it is never done by
  mistake). Slot 1 is the old single save: nothing to migrate.
- **The run belongs to a slot**: it is kept in the game state (`getActiveSlot`), not in
  the save. Save points write to it, and going back after a death loads the same one.
  Starting a new game erases its slot, because the slot holds the run in progress.
- **Progress of a slot**: `src/state/saveSummary.ts` works it out from the save when the
  slots are listed (time played, power-ups, weapons, rooms), and nothing is stored. To
  show something new (a percentage, bosses defeated) add it to `summarize()` and
  `describeSummary()`: the saves already written show it too.
- **Leaving a game**: the inventory has tabs, changed with L (previous) and Select
  (next). The _Exit_ tab goes back to the game, or to the Title without saving: what
  happened since the last save point is lost (the entry which quits is the second one,
  so it takes a move on purpose). Add a tab by adding its name to `TABS` in
  `InventoryScene.ts` and a container to `tabContents`.
- **Death**: the screen goes black and the Game Over scene asks what to do. Going back
  loads the last save of the slot, so what happened after it is lost; without a save the
  game starts from scratch. The logic is in `src/state/checkpoint.ts`.
- **Flags of the world**: things which change for good (today: destroyed blocks of the
  `breakables` layer) are flags in the game state (`setFlag` / `hasFlag`), saved with
  the game. Ids are made in `src/world/worldFlags.ts` and start with the map key.
- **Settings** are not part of the save: keep them in their own storage key.

### What the aim points at

When the aim points at something a shot would hit and which reacts to it, a block which breaks or an
enemy, the Player plays an animation of its own (standing still) and a small sound, once when it
starts to point at it (`src/entities/player/aimTarget.ts`). A wall in the way hides what is behind.
It looks up to 12 tiles away (`AIM_TARGET_RANGE`).

- **Blocks** are the ones of the `breakables` layer.
- **Enemies** do not exist yet: when they do, each one adds a probe to `scene.shootables`
  (`src/world/shootables.ts`) and removes it when it goes away.
- **Placeholders:** the animation (`hero_aim_target_<side>_animation`) borrows the frames of the
  standing pose, faster; change `sheet` in `PlayerAssets.ts` for the real one. The sound is
  `assets/audio/aim_target.wav`, set in `src/config/sounds.ts`: replace the file.
