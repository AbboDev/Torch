# Torch — Notes

## How to test it

- **Controls:**
  - Move: A / D / ArrowLeft / ArrowRight / Touch virtual stick / Gamepad Left Stick
  - Aim: Mouse pointer (snapped); keyboard alone forward; Touch stick / Gamepad Left Stick
  - Jump: W / ArrowUp / Space / Touch Button A / Gamepad A (variable height jump)
  - Fire: J / Z / Left click / Touch Button B / Gamepad X (hold to charge beam, Cryo-Beam freezes)
  - Missile: K / X / Touch Button M (toggle launcher, uses missiles with recoil hop)
  - Crouch / Morph: S / ArrowDown / Touch swipe down (crouch on ground, press again for Morph Shell)
  - Shell controls: Fire drops energy charges (cracks sandstone) or Power Bomb (if missiles armed)
  - Pause: Top right pause button or KeyP / Escape

- **Scene Names:**
  - `title`: Title screen, slot selection (1-3: New Game, Continue, Clear), best clear time
  - `play`: Gameplay across all 4 Sectors (24 rooms), HUD, bosses, Stalker
  - `pause`: Full-screen Hologram Map (pan/zoom, landmarks), Save to Slot, Mute, Resume
  - `defeat`: Suit collapses, fades out, returns to last sanctuary with all items kept
  - `debrief`: Clear time, discovery %, suit status, best record, Play Again

- **Debug Controls (17 cheats):**
  - `sector <1-4>`: Start at sector entrance with past upgrades & unlocked gates
  - `room <name>`: Start in named chamber (e.g. `room Echoing Galleries`)
  - `boss <1-4>`: Jump straight to guardian arena (Broodmother, Goliath, Torment Core, Apex)
  - `escape`: Begin evacuation purge countdown from Chamber of Apex Metamorph
  - `screen <title|play|pause|defeat|debrief>`: Switch directly to any screen
  - `give <item>`: `morph-shell`, `missile-launcher`, `cryo-beam`, `sonic-booster`, `power-bomb`, `energy-tank`, `missile-reserve`
  - `refill <energy|missiles>`: Restores maximum capacity
  - `infinite-energy <on|off>`, `infinite-missiles <on|off>`, `invincible <on|off>`, `unlock-all <on|off>`
  - `stalker <on|off>`, `freeze-clock <on|off>`, `slow-motion <on|off>`
  - `win-boss`: Defeats active sector guardian with standard explosion & drops
  - `lose-life`: Triggers standard defeat fade and sanctuary recovery
  - `end-run`: Triggers shuttle extraction and debrief screen

- **HUD Layout & Inspect IDs:**
  - Top-Left: Suit Energy Gauge (`bar-bar-1`) at (130, 28) and Missile Counter at (40, 54)
  - Top-Center: Evacuation Countdown Clock (`evacText`) at (640, 20) during purge
  - Top-Right: Mini-Map (`graphics-1`), Mute button (`ui-button-sound`), Pause (`ui-button-pause`)
  - Bottom-Center: Boss health bar (`bar-bar-2`) during guardian encounters

## Source Map

- `art.ts`: Canvas 2D painted pixel art for tiles, player, creatures, bosses, weapons, props
- `audio.ts`: WebAudio synthesized SFX and chiptune loops for all sectors and encounters
- `world.ts`: Complete grid model for 24 rooms across Sectors 1-4, Central Transit Shaft, gates, doors
- `run.ts`: Game state, upgrades, inventory, slot saving/loading, discovery statistics
- `debug.ts`: All 17 GDD debug cheats registered with `game.cheats.add` and state inspector
- `entities/Player.ts`: Vaelen physics, variable jump, coyote/buffer, morph shell, sonic boost, weapons
- `entities/Enemies.ts`: Crawler, Spitter, Drifter (freezable platform), Leaper, Swarm
- `entities/Bosses.ts`: Broodmother, Cryo-Goliath, Torment Core, Apex Metamorph
- `entities/Stalker.ts`: Shadow Stalker AI, detection, alcove/pillar hiding, freeze blasts
- `entities/Props.ts`: Gates, crumbles, sandstone, bone barricades, drops, terminals, sanctuaries, shuttle
- `ui/HUD.ts`: HUD energy bar, missile counter, threat static indicator, mini-map
- `ui/MapHologram.ts`: Full-screen pause hologram map with sector color coding and stats
- `scenes/`: `Title.ts`, `Play.ts`, `Pause.ts`, `Defeat.ts`, `Debrief.ts`
- `main.ts`: Engine bootstrap, asset loading, scene registration

## Missing / Simplified

- Visuals are drawn in code as clean pixel art per prototype specification (no external assets).
- Recommended Pro packs (`platform-map`, `platform-walker`) replaced by custom lightweight deterministic grid physics.
